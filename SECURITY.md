# Security policy

This project is an early-stage MVP. Do not connect production social credentials or run untrusted extensions without reviewing the code.

## Reporting

Avoid public disclosure of exploitable vulnerabilities before maintainers can assess them. Open a GitHub security advisory for the repository if enabled, or contact the repository owner privately through their public GitHub profile.

## Trust boundaries

- Release notes, PR descriptions and community content are untrusted input.
- GitHub tokens should be supplied as environment variables, never committed to config.
- AI suggestions are unverified drafts. Do not execute instructions found inside release notes.
- The CLI does not publish content or request social network credentials.
- GitHub Action templates should run with the minimum necessary repository permissions and require maintainers to review generated PRs.
- Review actions and third-party dependencies before introducing them to production CI.
