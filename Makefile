.PHONY: build release run check lint test

build:
	@cargo build

release:
	@cargo build --release

run:
	@cargo run

check:
	@cargo check

lint:
	@cargo clippy --all-targets --all-features -- -D warnings

test:
	@cargo test
