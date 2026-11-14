# Run Casework yourself

[← Project](../README.md) · [Scenarios](scenarios.md)

This preview is a **single-user synthetic-data sandbox**. You can run it on your own machine or a private server reached over SSH. It has no login or permission model and uses Python's development HTTP server. Public or multi-user production hosting is not supported yet.

## Pick the right mode

| Goal | Requirement | Start | What happens to data |
|---|---|---|---|
| Try it, leave nothing behind | Python 3.12+ | `python3 -m casework --demo` | A fresh temporary database; removed on normal shutdown |
| Keep a local workspace | Python 3.12+, writable working directory | `python3 -m casework` | Saved in `casework.db` across restarts |
| Run in a container | Docker Engine/Desktop, Compose v2.20+ | `docker compose up -d --build --wait` | Saved in the project's `casework-data` named volume |
| Evaluate on a remote server | Docker or Python there, SSH access from your machine | Start normally on the server; tunnel below | Same persistence rules as the selected mode |

Download and extract the [source ZIP](https://github.com/anshuman-pandey/casework/archive/refs/heads/main.zip), or clone:

```sh
git clone https://github.com/anshuman-pandey/casework.git
cd casework
```

A modern browser and an available local port are needed. Source download and the first Docker image build require internet access. After that, the app itself runs offline with bundled fonts, SQLite and synthetic data. It makes no provider calls and sends no telemetry. Native startup requires no `pip` or Node installation.

There is no benchmark-derived minimum hardware specification yet. For a small sandbox, 1 vCPU and 512 MiB available application memory are a planning allowance, not validated capacity; Docker Desktop has its own additional requirements. Enterprise capacity remains untested.

## Docker, with persistence

```sh
docker compose up -d --build --wait
docker compose ps
```

Open **http://127.0.0.1:8080**. Compose waits for the health check. The application runs as UID 10001 with a read-only root filesystem and a writable data volume. The container listens on its internal network, while Compose publishes only the host's loopback address. Keep that loopback port mapping.

```sh
docker compose logs --tail 50 casework
docker compose down
docker compose up -d --wait
```

The last two commands recreate the container and preserve data. **Do not add `--volumes` to `down` when you want to keep the database.** Keep the same Compose project name and directory, or specify `-p my-casework` consistently; a different project gets a different named volume.

For another port on macOS/Linux:

```sh
CASEWORK_PORT=8081 docker compose up -d --build --wait
```

On PowerShell, set `$env:CASEWORK_PORT = '8081'` before the Compose command. Keep that setting for subsequent commands. Open `http://127.0.0.1:8081`. The setting changes both the application and published port, preserving the Host/Origin checks.

## Native Python

```sh
python3 -m casework --demo
```

On Windows use `py -3` instead of `python3`. On a persistent run, use `--db /path/to/workspace.db` to choose the database; its parent folder must exist and be writable. Add `--empty` to omit the initial six cases. The Getting started screen can still create fresh samples. Add `--port 8081` if the default port is occupied. Stop with `Ctrl+C`.

Disposable mode never opens your persistent database. Graceful shutdown removes its temporary directory; a forced kill or machine crash can leave temporary files for the OS to clean up. Persistent mode never refreshes old evidence timestamps automatically; use a new practice case when evidence expires.

## A private server over SSH

Start the app on your server using the same Docker command. Leave the application port bound to server loopback. On your own machine:

```sh
ssh -N -L 8080:127.0.0.1:8080 your-user@your-server
```

Open `http://127.0.0.1:8080` locally. SSH supplies the encrypted connection and server access control. This is a private evaluation route, not multi-user application authentication. If port 8080 is busy, configure Casework and the two tunnel port numbers to the same alternative port.

Do not remove Host/Origin checks, publish `0.0.0.0:8080`, or add a public reverse proxy to work around this preview's deployment boundary.

## Verify the installation

The first-run guide is the human check. For a repeatable API check:

```sh
python3 -m casework.verify --url http://127.0.0.1:8080
```

Or inside Docker:

```sh
docker compose exec casework python3 -m casework.verify
```

For another port, append the matching `--url`. The verifier adds seven synthetic cases and checks 34 outcomes without changing existing records. Maintainers can run `python3 scripts/check_container.py` for an isolated build, health check, scenario run and container-recreation comparison. That script deletes only its own randomly named test project and test volume.

## Back up and check recovery

For this small sandbox, stop all writers before copying the SQLite file. Do not copy only a live `.db` file while writes might remain in its WAL.

Docker:

```sh
docker compose stop casework
docker compose cp casework:/data/casework.db ./casework-backup.db
docker compose start casework
```

Native: stop the server with `Ctrl+C`, then copy `casework.db` to a separate backup filename or location. Do not place sensitive data in Git; database files are ignored by this repository.

To inspect a recovered backup without replacing the original, with Python installed:

```sh
python3 -m casework --db casework-backup.db --empty --port 8081
```

Compare a known exported case with the recovered record. This is a manual sandbox recovery procedure, not an automated production backup system. A case's JSON export is portable evidence but there is no full-history JSON reimport API yet.

## Troubleshooting

| Symptom | Action |
|---|---|
| `python3` not found | Install Python 3.12+ or use Docker. On Windows try `py -3`. |
| Port already in use | Stop the other local instance or select another port as documented above. |
| SQLite cannot open/write the database | Check that the parent directory exists and is writable. In Docker use the supplied named volume. |
| Container is unhealthy | Read `docker compose logs --tail 50 casework`; verify Docker is running and the port is free. |
| `403` through a domain/proxy | Use the loopback URL or documented SSH tunnel. Custom/public domains are unsupported in this preview. |
| Sample no longer passes | Evidence becomes stale after 24 hours. Create fresh practice; the stale/future scenarios are intentionally blocked. |
| Records appear to have vanished | Check the working directory/database path or Compose project name. `--demo` is disposable by design. |
| First build cannot download the base image | Allow access to Docker Hub or prebuild the image on a connected machine. The app needs no network once installed. |

## Before real operational use

These are implementation requirements, not configuration toggles hidden in the preview:

- Authenticated users, organization isolation, roles, action permissions and session controls.
- A production application server, TLS, secure secrets and deployment hardening.
- Database migrations, reliable backups with restore drills, observability and resource limits.
- Independent audit retention, evidence attachment handling, privacy/retention policies and validated integrations.
- Pagination and measured workload limits; the current queue returns at most 500 cases.
- Grounded agent execution with evaluation datasets, explicit action authority and human oversight.

See [architecture](architecture.md), [security](../SECURITY.md) and [adoption requirements](adoption.md). No production certification or tested support for 50,000-person organizations is claimed.
