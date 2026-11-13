const BASE = "/assets/images/covers/";

const portfolio = [
  { couple: "Lisa & Bryan",       venue: "Hoyt Arboretum",                 location: "Portland, OR",     photog: "Dylan Howell Photography",   img: "Lisa-and-Bryan-Color.png",        slug: "lisa-bryan" },
  { couple: "Asheley & Ben",      venue: "Skamania Lodge",                 location: "Stevenson, WA",    photog: "Turville Photography",       img: "Asheley-and-Ben.png",             slug: "asheley-ben" },
  { couple: "Art of Wedding",     venue: "Everett West",                   location: "Portland, OR",     photog: "Catalina Jean Photography",  img: "AOW.png",                         slug: "art-of-wedding-everett-west" },
  { couple: "Danielle & Travis",  venue: "Everett West",                   location: "Portland, OR",     photog: "Kai Hayashi Photography",    img: "Danielle-and-Travis-Wedding.png", slug: "danielle-travis" },
  { couple: "Madison & Tyler",    venue: "Skamania Lodge",                 location: "Stevenson, WA",    photog: "Madye & Taylor Photography", img: "Madison-and-Tyler.png",           slug: "madison-and-tyler-2" },
  { couple: "Kristie & Zach",     venue: "Oregon Golf Club",               location: "West Linn, OR",    photog: "Analy Lee Photography",      img: "Kristie-and-Zack-Wedding.png",    slug: "kristie-and-zach" },
  { couple: "Katie & Royeric",    venue: "Bridal Veil Lakes",              location: "The Gorge, OR",    photog: "Stark Photography",          img: "Katie-and-Royeric2.png",          slug: "katie-and-royeric-3" },
  { couple: "Heather & John",     venue: "Abernethy Center",               location: "Oregon City, OR",  photog: "Brunette Photography",       img: "Heather-and-John.png",            slug: "heather-and-john-2" },
  { couple: "Karen & Nate",       venue: "The Foundry at Oswego Pointe",   location: "Lake Oswego, OR",  photog: "Lindsay Blair Photography",  img: "Karen-and-Nate-3.png",            slug: "karen-and-nate-2" },
  { couple: "Jeanna & Michael",   venue: "Union Pine",                     location: "Portland, OR",     photog: "Lindsay Blair Photography",  img: "Jeanna-and-Michael.png",          slug: null },
  { couple: "Jennifer & Marlo",   venue: "Oregon Golf Club",               location: "West Linn, OR",    photog: "B Sweet Imagery",            img: "Jennifer-and-Marlo.png",          slug: null },
  { couple: "Mary Kate & Marcus", venue: "The Butler Barn",                location: "Beaverton, OR",    photog: "Devyn Spangler Photography", img: "Mary-Kate-abd-Marcus.png",        slug: null },
];

// Sharp 600x750 portrait covers cut from each gallery (2026-11-13); couples
// without a gallery keep the original 592x330 landscape cover. shareImage stays
// landscape for link previews.
const fs = require("fs");
const path = require("path");
const ASSETS = path.join(__dirname, "..", "assets", "images", "covers");
const landscape = (p) => BASE + p.img.replace(/\.png$/i, ".jpg");
const coverFor = (p) =>
  p.slug && fs.existsSync(path.join(ASSETS, p.slug + "-cover.jpg")) ? BASE + p.slug + "-cover.jpg" : landscape(p);

module.exports = portfolio.map((p) => ({ ...p, cover: coverFor(p), shareImage: landscape(p) }));
