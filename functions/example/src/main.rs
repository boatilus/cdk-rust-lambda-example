use argon2::{self, Config, Variant, Version};
use lambda_http::{run, service_fn, Body, Error, Request, RequestExt, Response};
use quanta::Instant;
use serde_json::json;
use std::env;

static THREADS: u32 = 6;

async fn function_handler(event: Request) -> Result<Response<Body>, Error> {
    let salt = env::var("SALT").expect("Error: $SALT not found");

    // For demonstration's sake, just grab the password from the query param.
    let password = event
        .query_string_parameters_ref()
        .and_then(|params| params.first("password"))
        .unwrap_or("default_password")
        .as_bytes();

    let config = Config {
        variant: Variant::Argon2id,
        version: Version::Version13,
        mem_cost: 65536,
        time_cost: 1,
        // Argon2 'lanes' == threads
        lanes: THREADS,
        secret: &[],
        ad: &[],
        hash_length: 16,
    };

    let begin = Instant::now();
    let hash = argon2::hash_encoded(password, salt.as_bytes(), &config).unwrap();
    let elapsed = Instant::now().duration_since(begin);

    // This macro implements a neat trick of verifying that the value's
    // serializable as JSON at compile time.
    let body = json!({
        "hash": hash,
        "duration": elapsed.as_millis(),
    });

    let resp = Response::builder()
        .status(200)
        .header("content-type", "text/html")
        .body(body.to_string().into())
        .map_err(Box::new)?;
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    run(service_fn(function_handler)).await
}
