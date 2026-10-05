# Local checks

Run only the checks that CI did not run (Step 3). A trusted PR runs them in the review worktree when `local_checks` is `auto`. Every other PR runs them in a container. When `local_checks` is `off`, record each of these checks as "not run".

For each check, record the exit code and the end of its output. Record "unavailable", not a failure, when the check needs registry credentials, a network download (for example browser binaries), or an environment variable that is missing, or when it runs out of memory (exit code 137).

## Worktree (trusted PRs only)

The worktree uses the package store of this machine, so the install takes seconds, and the checks get the full CPU and memory.

1. Use the review worktree of Step 4. Create it now, with hooks disabled, when it does not exist yet.
2. Install with the frozen lockfile, for example `HUSKY=0 pnpm install --frozen-lockfile`. `HUSKY=0` stops the install from changing the git hooks of the repository.
3. Run each check script in the worktree.

Run only a PR that is trusted for its current head. When a later commit changes a dependency input, the PR moves to the container.

## Container (untrusted PRs)

The container is the only place where code of an untrusted PR runs. It gets no credentials and limited resources. The network is on only while the dependencies download, and in that phase no file of the PR that can run code is in the container.

Only pnpm has a tested recipe. For npm and yarn, record the container checks as "unavailable". A trusted PR still gets its checks in the worktree.

### 1. Validate every value that comes from the repository

The PR author controls these files. A raw value in a host command can inject shell code.

- `node_tag`: the first major version number in `.nvmrc`, `.node-version`, or `engines.node` (for example `24` from `24.18.0` or from `>=24`). It must match `^[0-9]{1,2}$`. Otherwise use `lts`.
- `pm_spec`: the `packageManager` field without its `+sha…` suffix. It must match `^pnpm@[0-9]+\.[0-9]+\.[0-9]+$`. Any other value (another package manager, a range, or a URL) makes the container checks "unavailable".
- `patch_files`: the files in the patch folder of the repository (for example `patches/`), which the lockfile can name. They are diffs that pnpm reads as data.
- Script names: each must match `^[A-Za-z0-9:._-]+$` and exist in the package manifest.

Pass each value as one quoted argument or as an environment variable. Never paste a repository value into a command string.

### 2. Run the two phases

Two containers share one temporary run volume. A cache volume for each project keeps the downloaded packages between runs. No host folder is mounted.

```bash
cache="scheduled-pr-review-cache-$(printf %s "$proj_key" | shasum -a 256 | cut -c1-16)"
vol="scheduled-pr-review-$run_token"
trap 'docker volume rm -f "$vol" >/dev/null 2>&1' EXIT
limits=(--memory 8g --cpus 2 --pids-limit 1024 --cap-drop ALL --security-opt no-new-privileges)
env=(-e CI=true -e COREPACK_HOME=/work/cache/corepack -e npm_config_store_dir=/cache/store/pnpm -e PM_SPEC="$pm_spec")

docker volume create "$cache"
docker volume create "$vol"
docker run --rm --network none -v "$cache:/cache" "node:$node_tag" sh -c 'mkdir -p /cache/store && chown node:node /cache/store'
docker run --rm --network none -v "$vol:/work" "node:$node_tag" sh -c 'mkdir /work/src /work/cache && chown node:node /work/src /work/cache'

# Download phase: network on, cache writable. Only the lockfile and the patch files go in.
git archive "$head_sha" -- pnpm-lock.yaml "${patch_files[@]}" | docker run --rm -i "${limits[@]}" --user node \
  -v "$vol:/work" -v "$cache:/cache" -w /work/src "${env[@]}" \
  "node:$node_tag" sh -c 'tar -x && timeout 1800 corepack "$PM_SPEC" fetch --ignore-pnpmfile'

# Check phase: network off, cache read-only. The full source goes in now.
git archive "$head_sha" | docker run --rm -i "${limits[@]}" --network none --user node \
  -v "$vol:/work" -v "$cache:/cache:ro" -w /work/src "${env[@]}" -e SCRIPTS="$scripts" \
  "node:$node_tag" sh -c 'tar -x && mkdir -p /work/cache/bin && corepack enable --install-directory /work/cache/bin && export PATH=/work/cache/bin:$PATH
    timeout 1800 pnpm install --frozen-lockfile --offline || exit 3
    for s in $SCRIPTS; do timeout 1800 pnpm run "$s"; echo "exit $s $?"; done'
```

- **Lockfile only while the network is on.** `pnpm fetch` fills the store from `pnpm-lock.yaml` alone. No `package.json`, `.npmrc`, `.pnpmfile`, or script of the PR is in the container in that phase, and `--ignore-pnpmfile` keeps pnpm hooks off. `.npmrc` stays out, so a private registry makes the checks "unavailable".
- **Pinned package manager.** `corepack "$PM_SPEC"` runs the validated pnpm version, so the PR cannot point corepack at another download.
- **Same folder in both phases.** pnpm registers the project folder in the store. The fetch runs in `/work/src`, so the offline install in the check phase finds the folder registered and does not write to the read-only cache.
- **Two folders in each volume.** The code goes into `/work/src`, the caches into `/work/cache` and `/cache/store`, all owned by the `node` user. Some runtimes (for example OrbStack) reset the owner of the volume root between containers, so `chown` only works on a subfolder. The caches stay out of the project folder, so `prettier --check .` and ESLint do not scan them.
- **`pnpm` on the `PATH`.** Package scripts often call `pnpm` directly. `corepack enable --install-directory` puts it on the `PATH` without root, from the pnpm that the download phase cached.
- **Install scripts only without network.** The offline install runs the install scripts of the dependencies and the `prepare` or `postinstall` script of the project. They cannot write to the cache, so a hostile PR cannot change the packages that later runs use.

### 3. Never weaken the container

- Give it no credentials: no `-e` with a token, no mount of the home folder, `.ssh`, the git folder, or the Docker socket.
- The download phase can still fetch any URL that the lockfile names. When that is not acceptable, use `local_checks=off`.
- Docker cannot enforce a disk quota on every runtime. The timeouts limit how long a phase can write. The `trap` removes the run volume on every exit path. After the run, when the cache volume is larger than 20 GB (`docker system df -v`), remove it with `docker volume rm "$cache"`.
- When no container runtime works (`docker info` fails), record each check as "not run". Never run an untrusted PR on this machine instead.
