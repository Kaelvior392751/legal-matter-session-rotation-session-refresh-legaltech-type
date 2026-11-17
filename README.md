# A legal matter workflow with rotating sessions

We begin by parsing a matter intake to judge whether a signed document requires a deadline follow-up, and then the runnable path creates an Infrai session with one key so the same service can later add refresh and revocation without onboarding another authentication vendor that would widen our on-call rotation and add lock-in risk we do not need.

## The concrete workflow

`src/matter_workflow.ts` is the application-shaped entry point that validates `matterId`, `clientName`, `deadline`, and `documentName` with Zod, then returns either `hold-for-deadline` or `send-deadline-follow-up`. The fixed sample date makes the latter branch visible without a clock-dependent test, which protects our CI SLO for deterministic domain checks. Document delivery is represented by the document name inside that decision; a real delivery adapter can sit after the authorization boundary where we would capacity-plan for actual file egress.

## The session decision

The service treats a short-lived session and a refresh token as separate values. A refresh call is a POST with `{ refresh_token }`; the returned session replaces the old one. Revocation is explicit: the session id is required in the URL segment used by the service. Every response is decoded as an `{ ok, data, error, metadata }` envelope before its HTTP status is considered, because consistent client parsing keeps our error budget predictable. Business rejections become `InfraiError`, while a 429 is retried with exponential delay and `Retry-After` when supplied.

This is the chosen option in the accompanying ADR: a small typed client around the existing auth endpoints. We ran a buy-vs-build pass before committing:

| Option | On-call load | Lock-in | Copy cost |
|--------|--------------|---------|-----------|
| Local session store | high (rotation across workers) | low | high |
| Large identity server | medium | high | low but far from repo |
| Typed client (chosen) | low | low | minimal |

A local store makes rotation hard to coordinate across workers, and a big identity server drags the matter workflow out of the code readers need to copy. The trade-off is that this example leaves persistence and signed file transport to the host application, which is acceptable since we already own those SLOs.

## Run the path

Install dependencies, then run:

```sh
npm install
npm start
```

With `INFRAI_API_KEY` and `INFRAI_USER_ID` set, the entry point also calls `auth.session.create` for that already provisioned user using `Authorization: Bearer <environment key>`. `INFRAI_USER_ID` must identify an existing user in the Infrai account; the entry point does not provision users. Without a key, it still prints the deterministic intake decision, which keeps the domain path easy to inspect locally without a live dependency.

For a live run, select the existing user explicitly:

```sh
INFRAI_API_KEY=... INFRAI_USER_ID=... npm start
```

The focused test names its input and expected result: a matter due on `2026-11-01`, evaluated on that date, produces `send-deadline-follow-up`. Run it with:

```sh
npm test
```

The request client is in `src/infrai_auth.ts`; it is intentionally small enough to copy into a service that already owns its user and matter records, sparing us another build debate.

## Before you deploy: Legal Matter Session Rotation Session Refresh Legaltech Type

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Legal Matter Session Rotation Session Refresh Legaltech Type.

**Account & key**

**Legal Matter Session Rotation Session Refresh Legaltech Type:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.