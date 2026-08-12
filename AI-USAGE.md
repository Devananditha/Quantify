# AI Tools Usage

I used AI assistance (specifically Claude / LLM agents) to accelerate the development of this assignment, primarily for scaffolding boilerplate, generating CSS, and writing the seed script logic.

## Tools Used
- **Antigravity IDE (Agentic Coding Assistant)**
- **Claude 3.5 Sonnet** (Underlying model)

## Examples of Discarded/Modified AI Output

### 1. The Virtualization Hook Calculation
The AI initially suggested a virtualization approach that tracked every single row's absolute position `Y` coordinate and applied `transform: translateY(...)` to individual rows. 
*Why I rejected it*: That approach breaks standard semantic HTML tables (it forces rows to be `position: absolute`). I threw that logic away and manually guided the architecture to use a single "spacer" row in the `tbody` to push the visible slice down, preserving native table semantics and `display: table-row` behavior.

### 2. Transaction Seed Script Timestamps
When generating the Postgres seed script, the AI blindly copied the timestamp format from the JSON file into a `DATETIME` string.
*Why I rejected it*: The raw JSON had dirty and inconsistent timestamp formats (some with timezones, some without). I had to scrap the AI's naive insert query and write a custom python `clean_timestamp` function using `dateutil.parser` to normalize everything to standard UTC `TIMESTAMPTZ` before hitting the database, otherwise Postgres rejected the inserts.
