set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

setup:
    npm ci --include=dev

run *args:
    npm run dev -- {{args}}

test *args:
    npm test -- {{args}}

lint:
    npm run lint

format-check:
    npm run format:check

type-check:
    npm run typecheck

build:
    npm run build

boot:
    npm run build
    npm run start

verify-focused *args:
    npm run test:focused -- {{args}}
    git diff --check

verify:
    just lint
    just format-check
    just type-check
    just test
    just build
    git diff --check
