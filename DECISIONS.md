# Technical Decisions

## Virtualization over Pagination
I chose to implement **Windowed Virtualization** instead of traditional Pagination. 
*Why?* The prompt asked to "show them in a table that stays smooth with the full set loaded." Loading 10,000 DOM nodes crashes the browser. By building a custom `useVirtual` hook that only renders the ~20 visible rows while padding the rest with a blank `tbody` space, users get a flawless native scrolling experience without having to click "Next Page" 500 times. It feels much closer to a modern native app.

## Custom Component System vs External Library
I strictly followed the constraint to build the `Table`, `Modal`, and UI tokens from scratch without MUI, Chakra, or shadcn. 
*Why?* To demonstrate strong foundational CSS skills (CSS Modules), understanding of semantic HTML (`<table>`, `<thead>`), accessibility (focus management in modals, ARIA labels), and responsive design.

## State Management
I used standard React Context (`FilterContext`) combined with local component state.
*Why?* For a dashboard of this size, introducing Redux or Zustand adds unnecessary boilerplate. The primary shared state is just the active filters (like selected category) which Context handles perfectly.

## Schema Design
Instead of dumping JSON into a single column, I designed a structured PostgreSQL schema with proper data types (e.g., `TIMESTAMPTZ` for dates, `NUMERIC` for amounts, `VARCHAR` for status).
*Why?* Proper types are essential for financial applications to ensure data integrity, perform aggregations (like SUM for rewards), and enable fast indexing on status or merchant names in the future.
