// restaurantUtils.js

function createRestaurant(name, locations, cuisine, specials, website) {
  return { name, location: locations, cuisine, specials, website };
}

export const daysOfWeek = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export const restaurantsList = [
  createRestaurant(
    "Postinos",
    ["Buckhead", "West Midtown"],
    "American",
    {
      Monday: "$25 gets you a bottle of wine and a bruschetta board — after 8 PM. A perfect late-night wind-down.",
      Tuesday: "$25 gets you a bottle of wine and a bruschetta board — after 8 PM. Same great deal as Monday.",
      Wednesday: "",
      Thursday: "",
      Friday: "",
      Saturday: "Brunch is back. Come hungry and plan to stay a while.",
      Sunday: "Sunday brunch — the perfect way to close out the weekend.",
    },
    "https://www.postinowinecafe.com"
  ),
  createRestaurant(
    "Pachengos",
    ["Buckhead"],
    "Mexican",
    {
      Monday: "",
      Tuesday: "$2 tacos all day — pollo, asada, pastor, or rajas (veggie). One of the best taco deals in Buckhead. Dine-in only.",
      Wednesday: "Industry Night — $5 house tequila shots and free chips & salsa from 5 PM to close. Bring the crew.",
      Thursday: "Tequila Thursday — $9 margaritas, $5 beers, and $8 wine from 5 PM to close. A fan favorite.",
      Friday: "Latino Night with a live DJ from 6–10 PM. Free chips & salsa after 9 PM. The weekend starts here.",
      Saturday: "Latino Night continues — live DJ from 6–10 PM, free chips & salsa from 9 PM to close.",
      Sunday: "Sunday brunch — the perfect reason to get out of the house.",
    },
    "https://www.pachengos.com/"
  ),
  createRestaurant(
    "Gypsy Kitchen",
    ["Buckhead"],
    "American",
    {
      Monday: "Happy hour daily 4–6 PM. Discounted drinks and bites in a cozy Mediterranean-inspired setting.",
      Tuesday: "Happy hour 4–6 PM. A reliable mid-week treat — great for after-work drinks.",
      Wednesday: "Happy hour 4–6 PM. Halfway through the week deserves a reward.",
      Thursday: "Happy hour 4–6 PM. Wind down before the weekend kicks off.",
      Friday: "Happy hour 4–6 PM. Kick off your Friday the right way.",
      Saturday: "Weekend brunch — come for the food, stay for the atmosphere.",
      Sunday: "Sunday brunch — a relaxed way to end the week.",
    },
    "https://static1.squarespace.com/static/53d80c4ae4b0326a80e22518/t/6321fec22ef3691d15b6d9ee/1663172292262/GKATL-HAPPYHR-web.pdf"
  ),
  createRestaurant(
    "The Iberian Pig",
    ["Buckhead", "Decatur"],
    "American",
    {
      Monday: "Happy hour 5–6 PM. Spanish-inspired tapas and drinks at reduced prices — a hidden gem.",
      Tuesday: "Happy hour 5–6 PM. Small plates, big flavors, great prices.",
      Wednesday: "Happy hour 5–6 PM. Mid-week tapas hour — bring a friend.",
      Thursday: "Happy hour 5–6 PM. One of Atlanta's most beloved tapas spots doing what it does best.",
      Friday: "Happy hour 4–6 PM — an extra hour to enjoy the weekend kickoff.",
      Saturday: "Happy hour 4–6 PM. Even weekends get a deal here.",
      Sunday: "Happy hour 5–6 PM. Wind down Sunday with quality bites and drinks.",
    },
    "https://static1.squarespace.com/static/5cb0fcadda50d3755d9e0e77/t/661d5f017d267a1e1d79c079/1713200897801/Happy+Hour+NEW+2024-04-10.pdf"
  ),
  createRestaurant(
    "Industry Tavern",
    ["Buckhead"],
    "American",
    {
      Monday: "Start the week with $6 El Jimador shots and $5 Dos XX Lager. Monday just got easier.",
      Tuesday: "Tito's Tuesday — $5 Tito's Vodka all night. A simple, solid deal.",
      Wednesday: "$6 Jack Daniel's Whiskey all night, plus Dirty South Trivia at 8 PM. Test your knowledge.",
      Thursday: "Throwback Thursday — $3.50 High Life and Coors Banquet. Classic beers, classic prices.",
      Friday: "$5 Twisted Tea Whiskey and $5 Twisted Tea Lite Cans. Close out the week in style.",
      Saturday: "$6 Creature Comforts draft — one of Atlanta's best local brews at a great price.",
      Sunday: "Half-priced High Noon cans. The ultimate Sunday recovery drink.",
    },
    "https://www.industrytavern.com/weekly-specials/"
  ),
  createRestaurant(
    "Eclipse di luna",
    ["Buckhead", "Dunwoody", "Alpharetta"],
    "American",
    {
      Monday: "Happy hour 4–6 PM: $5 tapas, $5 margaritas, mojitos, sangria, well liquor, beer & wine — plus half off all wine bottles all night.",
      Tuesday: "Happy hour 4–6 PM with the usual deals, plus $5 red and white sangria all day. Hard to beat.",
      Wednesday: "Happy hour 4–6 PM, and half off all paellas all night. A mid-week feast worth planning around.",
      Thursday: "Happy hour 4–6 PM — $5 tapas and $5 drinks. A solid way to get over the hump.",
      Friday: "Happy hour 4–6 PM to kick off the weekend right. $5 tapas and cocktails.",
      Saturday: "",
      Sunday: "Bottomless mimosas and sangria from 12–4 PM, plus the full menu all day. Sunday done right.",
    },
    "https://eclipsediluna.com/buckhead-deal/"
  ),
  createRestaurant(
    "5Church",
    ["Buckhead", "Midtown"],
    "American",
    {
      Monday: "Happy hour at the downstairs bar, Mon–Fri from 3–5 PM. Stylish spot, smart prices.",
      Tuesday: "Happy hour 3–5 PM downstairs. A midday reset worth penciling in.",
      Wednesday: "Happy hour 3–5 PM. 5Church's downstairs bar is one of Midtown's best-kept secrets.",
      Thursday: "Happy hour 3–5 PM. Pre-game the weekend at one of Atlanta's most striking restaurants.",
      Friday: "Happy hour 3–5 PM — a great reason to leave the office early.",
      Saturday: "",
      Sunday: "",
    },
    "https://midtown.5church-atlanta.com/atlanta-midtown-5church-midtown-food-menu"
  ),
  createRestaurant(
    "Superica",
    ["Buckhead", "Midtown", "Alpharetta", "Battery"],
    "Mexican",
    {
      Monday: "Siesta menu at the bar from 2:30–5 PM (select locations), plus lunch specials from 11–2:30 PM. Two deals in one day.",
      Tuesday: "Bar siesta menu 2:30–5 PM at select locations, plus lunch specials 11–2:30 PM.",
      Wednesday: "Bar siesta menu 2:30–5 PM, lunch specials 11–2:30 PM. The week's best Tex-Mex window.",
      Thursday: "Bar siesta menu 2:30–5 PM, lunch specials 11–2:30 PM. Don't miss the margaritas.",
      Friday: "Bar siesta menu 2:30–4 PM (slightly shorter — arrive early), plus lunch specials 11–2:30 PM.",
      Saturday: "Weekend brunch — Superica's brunch is a crowd favorite. Come hungry.",
      Sunday: "Sunday brunch at one of Atlanta's most popular Tex-Mex spots. A true staple.",
    },
    "https://superica.com/buckhead/#menus"
  ),
  createRestaurant(
    "Red Pepper Taqueria",
    ["Buckhead", "Brookhaven", "Decatur", "Dunwoody"],
    "Mexican",
    {
      Monday: "A dozen fresh Gulf oysters for $12 (add chargrilled for $2), plus $8 Cutwater Mojitos. Happy hour 3–6 PM and 9 PM to close.",
      Tuesday: "All signature tacos just $3 (add $1 for birria or carne asada, $2 for blackened salmon). Happy hour 3–6 PM and 9 PM to close.",
      Wednesday: "Wine Wednesday — all wine by the glass or bottle is half off. Happy hour 3–6 PM and 9 PM to close.",
      Thursday: "$3 pints and $8 skinny margaritas. Happy hour 3–6 PM and 9 PM to close.",
      Friday: "$10 Black Sheep Tequila 'Agua Azul.' Happy hour 3–6 PM and 9 PM to close.",
      Saturday: "$20 bottomless mimosas from 11 AM to 4 PM. Brunch the right way.",
      Sunday: "$20 bottomless mimosas from 11 AM to 4 PM. Sunday is meant for this.",
    },
    "https://www.redpepperatl.com/weekly-specials"
  ),
  createRestaurant(
    "Fados Irish Pub",
    ["Buckhead", "Midtown"],
    "American",
    {
      Monday: "Happy hour runs 2–7 PM — one of the longest happy hours in Atlanta. Hard to miss.",
      Tuesday: "Happy hour 2–7 PM. Five full hours of deals at a classic Irish pub.",
      Wednesday: "Happy hour 2–7 PM. Perfect for a mid-week pint with friends.",
      Thursday: "Happy hour 2–7 PM. Wind down before the weekend with a cold Guinness.",
      Friday: "Happy hour 11:30 AM–7 PM, then $25 bottomless Moscow Mules from 7–9 PM. A full evening of deals.",
      Saturday: "$17 bottomless mimosas until 3 PM. A Fado's weekend tradition.",
      Sunday: "$17 bottomless mimosas until 3 PM. Great value to close out the weekend.",
    },
    "https://www.fadoirishpub.com/atlanta-menu#menu=atl-specials"
  ),
  createRestaurant(
    "Whiskey Bird",
    ["Midtown"],
    "American",
    {
      Monday: "",
      Tuesday: "Happy hour 4–6 PM. Craft cocktails and a relaxed Midtown vibe — a solid after-work spot.",
      Wednesday: "Happy hour 4–6 PM. A favorite stop for Midtown locals mid-week.",
      Thursday: "Happy hour 4–6 PM. Great cocktails at reduced prices before the weekend rush.",
      Friday: "Happy hour 3–5:30 PM. Get an early start on the weekend.",
      Saturday: "Happy hour 3–5:30 PM. Yes, even on Saturdays — a rare find.",
      Sunday: "Happy hour 3–5:30 PM. Whiskey Bird makes Sunday feel special.",
    },
    "https://media-cdn.getbento.com/accounts/aa0c61a8fb9614ce33218fcd789960c7/media/7gwcmpKRMOHb2vllAgmA_HH_MENU_April_2024.pdf"
  ),
  createRestaurant(
    "Establishment",
    ["Midtown"],
    "American",
    {
      Monday: "",
      Tuesday: "After-work specials 4–6 PM, dine-in only. A refined spot to decompress after a long Tuesday.",
      Wednesday: "After-work specials 4–6 PM, dine-in only. A mid-week treat in the heart of Midtown.",
      Thursday: "After-work specials 4–6 PM, dine-in only. Wind down Thursday in style.",
      Friday: "After-work specials 4–6 PM, dine-in only. Kick off your Friday with something special.",
      Saturday: "",
      Sunday: "",
    },
    "https://establishmentatlanta.com/atlanta-establishment-midtown-food-menu"
  ),
  createRestaurant(
    "Snap Thai",
    ["Buckhead"],
    "Asian",
    {
      Monday: "",
      Tuesday: "Happy hour 3–5:30 PM. Authentic Thai flavors at happy hour prices — a rare combination.",
      Wednesday: "Happy hour 3–5:30 PM. Pair Thai small plates with discounted drinks mid-week.",
      Thursday: "Happy hour 3–5:30 PM. One of Buckhead's most underrated happy hours.",
      Friday: "Happy hour 3–5:30 PM. Close out the week with something different.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.snapthaiatl.com/menu"
  ),
  createRestaurant(
    "Beetlecat",
    ["Inman Park"],
    "Seafood",
    {
      Monday: "Oyster happy hour Mon–Fri, 4–5 PM. Fresh oysters at their best — don't let the one-hour window fool you.",
      Tuesday: "Oyster happy hour 4–5 PM. A Tuesday ritual for Inman Park regulars.",
      Wednesday: "Oyster happy hour 4–5 PM. Get there early — it goes fast.",
      Thursday: "Oyster happy hour 4–5 PM. One of Atlanta's best weekday seafood deals.",
      Friday: "Oyster happy hour 4–5 PM. The perfect start to your Friday night.",
      Saturday: "",
      Sunday: "",
    },
    "https://beetlecatatl.com/"
  ),
  createRestaurant(
    "Biltong Bar",
    ["Ponce City Market"],
    "South African",
    {
      Monday: "Happy hour deals on South African snacks and drinks starting at noon. A one-of-a-kind experience at PCM.",
      Tuesday: "Happy hour from noon onward. Biltong, craft drinks, and good vibes inside Ponce City Market.",
      Wednesday: "Happy hour from noon. Midweek is the perfect time to discover something new.",
      Thursday: "Happy hour from noon onward. South African flavors you won't find anywhere else in Atlanta.",
      Friday: "Happy hour from noon — get the weekend started early with bold flavors and cold drinks.",
      Saturday: "",
      Sunday: "",
    },
    "https://biltong-bar.com/"
  ),
];

const allLocations = restaurantsList.reduce((locations, restaurant) => {
  restaurant.location.forEach((location) => {
    if (!locations.includes(location)) locations.push(location);
  });
  return locations;
}, []);

export const locationOptions = ["All", ...allLocations];

export const cuisineOptions = [
  "All",
  "American",
  "Mexican",
  "Asian",
  "Seafood",
  "South African",
];
