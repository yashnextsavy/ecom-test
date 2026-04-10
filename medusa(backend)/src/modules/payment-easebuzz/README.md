# Easebuzz Payment Provider

Custom Medusa payment provider for Easebuzz.

Required env vars:

- `EASEBUZZ_KEY`
- `EASEBUZZ_SALT`
- `EASEBUZZ_SUCCESS_URL`
- `EASEBUZZ_FAILURE_URL`

Optional env vars:

- `EASEBUZZ_ENV` (`test` or `production`)
- `EASEBUZZ_PRODUCT_INFO`
- `EASEBUZZ_PAYMENT_URL`
- `EASEBUZZ_REFUND_URL`
- `EASEBUZZ_REFUND_API_VERSION` (`v2` default, can set `v1`)

Provider identifier:

- `easebuzz` (runtime provider id becomes `pp_easebuzz_default` when registered with `id: "default"`).
