set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

setup:
    npm install

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
