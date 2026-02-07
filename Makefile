.PHONY: build release run check lint test

build:           ; @cargo build
build-dashboard: ; @pnpm -C dashboard install && pnpm -C dashboard build
release:         ; @cargo build --release
run:             ; @cargo run
check:           ; @cargo check
lint:            ; @cargo clippy --all-targets --all-features -- -D warnings
test:            ; @cargo test
dev-website:     ; @pnpm -C dashboard install && pnpm -C dashboard dev
