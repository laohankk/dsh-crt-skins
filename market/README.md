# market/ — submission material

These are the registry entries for the **DSH Skin Market**
(`kingOfSoySauce/dsh-skin-market`). They are *not* consumed by DSH itself; the
market reads them from `registry/skins/`, one file per skin.

Monorepo rule: the file name is the repo path with `/` written as `--`:

```
registry/skins/laohankk__dsh-crt-skins--packages--skins--crt-terminal.yml
registry/skins/laohankk__dsh-crt-skins--packages--skins--pipboy-terminal.yml
```

Because the market wants one YAML per PR, submit them as **two separate PRs**
against the market repository, each with a title of the form
`feat(registry): add CRT Terminal`. The market's CI fills in the install target,
the pinned commit SHA, screenshots and the health block from the public repo —
the entry itself stays thin.

The two entries below are the exact files to drop into the market PR — nothing
else in this repository needs to change for the submission.
