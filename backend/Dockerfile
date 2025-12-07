# ===== Stage 1: Build =====
FROM rust:1.72 as builder

# Install dependencies for building (OpenSSL, etc.)
RUN apt-get update && apt-get install -y libssl-dev pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy Cargo files first for caching
COPY Cargo.toml Cargo.lock ./

# Dummy main.rs to pre-build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release || true
RUN rm -rf src/*

# Copy actual source code
COPY . .

# Build final binary
RUN cargo build --release

# ===== Stage 2: Runtime =====
FROM debian:bullseye-slim

# Install OpenSSL runtime
RUN apt-get update && apt-get install -y libssl1.1 ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the compiled binary from builder
COPY --from=builder /usr/src/app/target/release/backend .

# Expose port
EXPOSE 10000

# Environment variables
ENV RUST_LOG=info
ENV MONGO_URI=mongodb://mongo:27017

# Start the backend
CMD ["./backend"]
