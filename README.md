## Setup

To run the app use `docker compose up [--build] [--detach]`
To stream logs from the app only use `docker compose logs -f app`

If need to install dependencies, use usual `npm i {dependency_name}`.
And then drop volumes `docker compose down -v` to rebuild the container with new dependencies.

URLs:

- App: http://localhost:4000
- Docs: http://localhost:4000/documentation
- PGAdmin: http://localhost:5050
  - User: admin@example.com / admin
  - Db Password: postgres

## Tasks

> Explain design choices and improvements and optimizations you would make

1. Implement `/reports/actions` endpoint. Method - how you see fit (GET/POST).
   - It should return a simple JSON array with actions and user data per action
   - Add filters:
     - by date range
     - by action type
     - by users
     - by some metadata fields, for example - ip address or zodiac sign
     - Add pagination
   - Filters should be validated
2. Implement a background job that works in a similar way as an endpoint,
   but instead saves all the data to a CSV file on the server.
   - Track the progress of the job (DB / REDIS)
   - Store the resulting URL (DB / REDIS)
   - Add an endpoint to get the file when the job is ready
3. Add a GET endpoint to get the aggregated statistics on actions
   - It accepts a date range
   - Returns an object with counts of each action type in the given date range and unique users count per type

   ```json
   {
     "data": {
       "convert": { "count": 1500, "uniqueUsers": 1400 },
       "compress": { "count": 1300, "uniqueUsers": 1200 },
       "resize": { "count": 300, "uniqueUsers": 250 }
       // ...
     }
   }
   ```

   - Prefer raw SQL for this
   - Propose caching strategy for this endpoint

4. Explain how you would make sure that these reports are only accessible to ADMIN users
5. Explain what and how you would test in this task
