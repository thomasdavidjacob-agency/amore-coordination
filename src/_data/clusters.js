// Blog topic clusters for the 90-day drip (plan: TDJ-Vault/Agency/Clients/Amore - 90-Day Blog Drip Plan.md).
// Each post sets `cluster: <key>` in its front matter. A hub page is built at /blog/topic/<slug>/
// once a cluster has at least one live post. `service` is the page every post in the cluster
// must link to (the build lint checks it), and where its "From the Journal" block appears.
module.exports = {
  A: { slug: "hiring-a-planner", name: "Choosing & Hiring Help", service: "/services/", blurb: "What planners and coordinators actually do, how the levels of support differ, and how to choose the right help for your wedding." },
  B: { slug: "timelines-and-checklists", name: "Timelines & Checklists", service: "/services/", blurb: "From the first weeks of your engagement to the last two weeks before the wedding: what to do, and when." },
  C: { slug: "wedding-budget", name: "Wedding Budget", service: "/services/", blurb: "Setting a budget, the costs couples forget, and how to read vendor quotes without surprises." },
  D: { slug: "venues", name: "Venues & Places", service: "/services/", blurb: "Choosing a venue in Portland, the Willamette Valley, the Gorge, the coast and SW Washington, and the questions to ask before you sign." },
  E: { slug: "seasons-and-weather", name: "Seasons & Weather", service: "/services/", blurb: "Planning around Pacific Northwest seasons: the best months, rain plans, and what guests should wear." },
  F: { slug: "micro-weddings", name: "Micro Weddings", service: "/services/micro-wedding/", blurb: "Planning an intimate wedding of 50 guests or fewer, with every detail still thoughtfully coordinated." },
  G: { slug: "elopements", name: "PNW Elopements", service: "/services/pnw-elopement/", blurb: "Eloping on the Oregon Coast, in the Gorge, on Mt. Hood and closer to home in Portland." },
  H: { slug: "permits-and-licenses", name: "Permits & Licenses", service: "/services/", blurb: "Marriage licenses on both sides of the river, park reservations, and how to find out whether your location needs a permit." },
  I: { slug: "vendors-and-the-day", name: "Vendors & the Wedding Day", service: "/services/", blurb: "Booking vendors, keeping them in sync, and the day-of details that make a wedding run smoothly." },
  J: { slug: "holiday-events", name: "Holiday & Seasonal Events", service: "/services/holiday-events/", blurb: "Holiday parties, family gatherings and winter celebrations, planned without the stress." },
};
