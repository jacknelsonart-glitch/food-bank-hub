# Food Bank Hub

An open source web app for food banks, used by the people who run them, the people who help, and the people who need food.

- **Find food:** a map and list of food banks, showing which are open now or this weekend, with directions and distance from you.
- **Calendar:** every opening across all food banks, including weekend and one-off sessions, with a feed you can add to your phone's calendar.
- **Help out:** local businesses sign up to donate surplus food and volunteers sign up to sort or deliver it. Staff approve them.
- **Sort donations:** scan a barcode (details come from [Open Food Facts](https://world.openfoodfacts.org)) or take a photo (Claude identifies the item). A volunteer checks the suggestion, including the date and allergens, before it goes into stock.
- **Pack a parcel:** pick items for a household and see how many days of food it gives them and which nutrients it's short of, against UK reference intakes or US Daily Values.

It works on phones and can be added to the home screen.

## Run it

Needs Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000. A fresh install includes three fictional example food banks so there's something to look at; set `SEED_DEMO=false` to start empty.

Data is stored in a SQLite file (`data/foodbank.db` by default), so hosting needs a server with a persistent disk, such as a small VPS, Fly.io or Railway with a volume.

### Settings

| Variable | What it does |
| --- | --- |
| `STAFF_PASSWORD` | Password for the staff pages. Required in production: staff pages stay locked until it's set. Any username works. |
| `ANTHROPIC_API_KEY` | Turns on AI photo sorting. Without it, barcode and manual entry still work. |
| `DATABASE_PATH` | Where the SQLite file lives. |
| `SEED_DEMO` | Set to `false` to skip the example food banks. |
| `OPEN_FOOD_FACTS_USER_AGENT` | Identifies your site to Open Food Facts, as they ask. |

## Who sees what

Finding food, the calendar and the sign-up form are public, and nobody needs an account. Sorting donations, packing parcels, the stock list and sign-up details are behind the staff password.

The app stores no information about the people receiving food. The parcel check only asks how many people of each age group a parcel is for.

## How the nutrition check works

Each item stores nutrients per 100 g, read from Open Food Facts, estimated by AI from a photo (and marked as estimated), or typed in. A parcel's totals are compared with the household's daily needs: the 2,000 kcal reference amounts scaled by each person's typical energy need. "Days of food" is based on calories. A nutrient is flagged as low when it covers much less than the calories do, and only when most of the parcel has data for it. It's a guide for packing balanced parcels, not dietary advice.

## Development

```bash
npm test          # unit tests
npm run lint
npm run typecheck
```

Built with Next.js, React, Tailwind CSS, SQLite (built into Node.js), Leaflet with OpenStreetMap, and the Anthropic API.

## Ideas for what's next

- Recipient accounts and booking a collection slot
- Showing recipients what's in stock before they visit
- Routes for volunteer drivers
- Alerts to businesses when a food bank runs low on something
- Postgres for larger, multi-site deployments

## Licence

AGPL-3.0 (see [LICENSE](LICENSE)). You can use, change and host it freely; if you run a modified version for others, share your changes. The footer's "Source code" link covers this; point it at your own copy if you change the code.
