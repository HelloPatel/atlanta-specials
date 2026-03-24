// restaurantUtils.js

function createRestaurant(name, locations, cuisine, specials, website, image) {
  return { name, location: locations, cuisine, specials, website, image };
}

export const daysOfWeek = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=600&h=240&fit=crop&auto=format&q=80`;

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
    "https://www.postino.com/",
    "/images/postinos.webp"
  ),
  createRestaurant(
    "Gypsy Kitchen",
    ["Buckhead"],
    "American",
    {
      Monday: "Happy hour 4–6 PM: $11 cocktails, $8 wine, $5 patatas bravas and croquetas. Mediterranean-inspired bites in one of Buckhead's coziest spots.",
      Tuesday: "Happy hour 4–6 PM. $11 cocktails, $8 wine, $9–11 flatbreads. A reliable mid-week treat.",
      Wednesday: "Happy hour 4–6 PM. $11 cocktails and $8 wine — halfway through the week deserves a reward.",
      Thursday: "Happy hour 4–6 PM. Wind down before the weekend kicks off.",
      Friday: "Happy hour 4–6 PM. Kick off your Friday the right way.",
      Saturday: "Weekend brunch — come for the food, stay for the atmosphere.",
      Sunday: "Sunday brunch — a relaxed way to end the week.",
    },
    "https://www.gypsykitchenatl.com/",
    "/images/gypsy-kitchen.webp"
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
      Friday: "Happy hour 4–5 PM — catch it early for an extra hour at Buckhead, the full window at Decatur.",
      Saturday: "Happy hour 5–6 PM. Even weekends get a deal here.",
      Sunday: "Happy hour 5–6 PM. Wind down Sunday with quality bites and drinks.",
    },
    "https://theiberianpig.com/",
    "/images/iberian-pig.webp"
  ),
  createRestaurant(
    "Industry Tavern",
    ["Buckhead"],
    "American",
    {
      Monday: "$5 Monday Night Draft and $6 Jack Daniel's. Monday just got easier.",
      Tuesday: "Tito's Tuesday — $5 Tito's Vodka all night. A simple, solid deal.",
      Wednesday: "$6 El Tequileno Blanco and $5 Dos XX Lager, plus Dirty South Trivia at 8 PM. Test your knowledge.",
      Thursday: "$4 High Life and Coors Banquet. Classic beers, classic prices.",
      Friday: "$6 Old Forrester Bourbon and $6 Old Forrester Rye. Close out the week in style.",
      Saturday: "$5 Sam Adams Draft and $6 Sun Cruiser Cans. A great excuse to stay out late.",
      Sunday: "$5 Blue Moon Draft and $6 High Noon Cans. The ultimate Sunday recovery drinks.",
    },
    "https://www.industrytavern.com/weekly-specials/",
    "/images/industry-tavern.webp"
  ),
  createRestaurant(
    "Eclipse di Luna",
    ["Buckhead", "Dunwoody", "Alpharetta"],
    "American",
    {
      Monday: "Happy hour 4–6 PM: $7 tapas, $6 drinks — plus half off all wine bottles all night. Monday's best excuse to stay out.",
      Tuesday: "Happy hour 4–6 PM with the usual $7 tapas and $6 drinks, plus $6 margaritas all day. Hard to beat.",
      Wednesday: "Happy hour 4–6 PM, and half off all paellas all night. A mid-week feast worth planning around.",
      Thursday: "Happy hour 4–6 PM — $7 tapas, $6 drinks, and 20% off all flight boards. A solid way to get over the hump.",
      Friday: "Happy hour 4–6 PM to kick off the weekend right. $7 tapas and $6 cocktails.",
      Saturday: "Happy hour 4–6 PM. Even weekends get a deal here.",
      Sunday: "Bottomless mimosas and sangria from 12–4 PM, plus the full menu all day. Sunday done right.",
    },
    "https://eclipsediluna.com/buckhead-deal/",
    "/images/eclipse-di-luna.webp"
  ),
  createRestaurant(
    "5Church",
    ["Buckhead", "Midtown"],
    "American",
    {
      Monday: "Happy hour at the downstairs bar, Mon–Fri from 3–7 PM. Stylish spot, smart prices.",
      Tuesday: "Happy hour 3–7 PM downstairs. A midday reset worth penciling in.",
      Wednesday: "Happy hour 3–7 PM. 5Church's downstairs bar is one of Atlanta's best-kept secrets.",
      Thursday: "Happy hour 3–7 PM. Pre-game the weekend at one of Atlanta's most striking restaurants.",
      Friday: "Happy hour 3–7 PM — four full hours to kick off the weekend right.",
      Saturday: "",
      Sunday: "",
    },
    "https://midtown.5church-atlanta.com/atlanta-midtown-5church-midtown-food-menu",
    "/images/5church.webp"
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
    "https://superica.com/buckhead/#menus",
    "/images/superica.webp"
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
    "https://www.redpepperatl.com/",
    img("1551504734-5ee1c4a1479b") // Mexican tacos & margarita
  ),
  createRestaurant(
    "Fados Irish Pub",
    ["Buckhead", "Midtown"],
    "American",
    {
      Monday: "Happy hour 4–7 PM — $6 draft beer, $7.50 wine, $8 cocktails, $6 snacks. Three solid hours at a classic Irish pub.",
      Tuesday: "Happy hour 4–7 PM. Five different bites for $6, cold pints to match.",
      Wednesday: "Happy hour 4–7 PM. Perfect for a mid-week pint with friends.",
      Thursday: "Happy hour 4–7 PM. Wind down before the weekend with a cold Guinness.",
      Friday: "Happy hour 4–7 PM, then $24 bottomless Moscow Mules from 7–9 PM. A full evening of deals.",
      Saturday: "$20 bottomless mimosas until 3 PM. A Fado's weekend tradition.",
      Sunday: "$20 bottomless mimosas until 3 PM. Great value to close out the weekend.",
    },
    "https://www.fadoirishpub.com/",
    "/images/fado-irish-pub.webp"
  ),
  createRestaurant(
    "Whiskey Bird",
    ["Virginia Highland"],
    "American",
    {
      Monday: "",
      Tuesday: "",
      Wednesday: "Happy hour 4–6:30 PM. Craft cocktails and a relaxed Virginia Highland vibe — a solid after-work spot.",
      Thursday: "Happy hour 4–6:30 PM. $10 cocktails and Pacific Rim-inspired bites before the weekend rush.",
      Friday: "Happy hour 3–6 PM. Get an early start on the weekend.",
      Saturday: "Happy hour 3–6 PM. Yes, even on Saturdays — a rare find in the neighborhood.",
      Sunday: "Happy hour 3–6 PM. Whiskey Bird makes Sunday feel special.",
    },
    "https://www.eatwhiskeybird.com/",
    "/images/whiskey-bird.webp"
  ),
  createRestaurant(
    "Establishment",
    ["Midtown"],
    "American",
    {
      Monday: "After-work specials 3–7 PM, dine-in only. A refined spot to decompress after a long Monday.",
      Tuesday: "After-work specials 3–7 PM, dine-in only. A refined spot to decompress after a long Tuesday.",
      Wednesday: "After-work specials 3–7 PM, dine-in only. A mid-week treat in the heart of Midtown.",
      Thursday: "After-work specials 3–7 PM, dine-in only. Wind down Thursday in style.",
      Friday: "After-work specials 3–7 PM, dine-in only. Kick off your Friday with something special.",
      Saturday: "",
      Sunday: "",
    },
    "https://establishmentatlanta.com/atlanta-establishment-midtown-food-menu",
    "/images/establishment.jpg"
  ),
  createRestaurant(
    "Snap Thai",
    ["Buckhead"],
    "Asian",
    {
      Monday: "",
      Tuesday: "Happy hour 3–6 PM. Authentic Thai flavors at happy hour prices — a rare combination.",
      Wednesday: "Happy hour 3–6 PM. Pair Thai small plates with discounted drinks mid-week.",
      Thursday: "Happy hour 3–6 PM. One of Buckhead's most underrated happy hours.",
      Friday: "Happy hour 3–6 PM. Close out the week with something different.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.snapthaiatl.com/menu",
    img("1569050467447-ce54b3bbc37d") // Thai noodles
  ),
  createRestaurant(
    "Beetlecat",
    ["Inman Park"],
    "Seafood",
    {
      Monday: "Oyster happy hour Mon–Fri, 4–6 PM. $2 oysters and $10 oyster martinis — don't let the two-hour window fool you.",
      Tuesday: "Oyster happy hour 4–6 PM. $2 oysters and a Tuesday ritual for Virginia Highland regulars.",
      Wednesday: "Oyster happy hour 4–6 PM. Get there early — the best seats go fast.",
      Thursday: "Oyster happy hour 4–6 PM. One of Atlanta's best weekday seafood deals.",
      Friday: "Oyster happy hour 4–6 PM. The perfect start to your Friday night.",
      Saturday: "",
      Sunday: "",
    },
    "https://beetlecatatl.com/",
    "/images/beetlecat.webp"
  ),
  createRestaurant(
    "The Big Ketch",
    ["Buckhead"],
    "Seafood",
    {
      Monday: "Happy hour 4:30–7:30 PM: $1 oysters (minimum half dozen), $4 shrimp tacos, $4 domestic beers, $8 cocktails. Plus a Burger & Brew combo to anchor the night.",
      Tuesday: "Happy hour 4:30–7:30 PM. Buy any bottle of wine and get a free menu item on the side — a Tuesday worth showing up for.",
      Wednesday: "Happy hour 4:30–7:30 PM. $1 oysters, $4 shrimp tacos, $4 beers, $8 cocktails — the full spread.",
      Thursday: "Happy hour 4:30–7:30 PM. The easiest way to end a Thursday in Buckhead.",
      Friday: "Happy hour 4:30–7:30 PM. $1 oysters to kick off the weekend — get there early for the best seats.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.thebigketch.com/",
    img("1565680018434-b513d5e5fd47") // grilled seafood
  ),
  createRestaurant(
    "Grana",
    ["Morningside", "Dunwoody"],
    "Italian",
    {
      Monday: "Aperitivo Hour 4–6 PM: $10 whole Neapolitan pizzas, $9 wine, $11 cocktails, $6 beer. The best pizza deal in Atlanta — full stop.",
      Tuesday: "Aperitivo Hour 4–6 PM. $10 whole pizzas and $9 wine. Come hungry, leave happy.",
      Wednesday: "Aperitivo Hour 4–6 PM. Wood-fired Neapolitan pizza at $10 on a Wednesday is nearly criminal.",
      Thursday: "Aperitivo Hour 4–6 PM. The best pre-weekend pizza deal in the neighborhood.",
      Friday: "Aperitivo Hour 4–6 PM. $10 whole pizzas to kick off the weekend the right way.",
      Saturday: "Aperitivo Hour 4–6 PM. Even on weekends — Grana doesn't take days off.",
      Sunday: "Aperitivo Hour 4–6 PM. Wood-fired pizza to close out the weekend. A non-negotiable Sunday ritual.",
    },
    "https://www.granaatl.com/",
    img("1565299624946-b28f40a0ae38") // Neapolitan pizza
  ),
  createRestaurant(
    "Ela",
    ["Virginia Highland"],
    "Mediterranean",
    {
      Monday: "Happy hour 4–6 PM: $6 hummus dip, $8 cauliflower falafels, $6 wine by the glass. Mediterranean small plates in one of Atlanta's best neighborhoods.",
      Tuesday: "Happy hour 4–6 PM. $6 hummus, $8 falafels, $6 wine. A Tuesday with genuine character.",
      Wednesday: "Happy hour 4–6 PM. Ela's warm spices and natural wine make mid-week feel like a mini escape.",
      Thursday: "Happy hour 4–6 PM. One of the most underrated patios in Virginia-Highland.",
      Friday: "Happy hour 4–6 PM. Wind into the weekend with mezze and good wine.",
      Saturday: "Happy hour 3–5 PM. A rare weekend deal — Mediterranean bites before the dinner rush.",
      Sunday: "Happy hour 3–5 PM. Ela on a Sunday afternoon hits different.",
    },
    "https://www.ela-atlanta.com/",
    img("1544025162-d76694265947") // Mediterranean mezze spread
  ),
  createRestaurant(
    "Roshambo",
    ["Buckhead"],
    "American",
    {
      Monday: "Happy hour 4–6 PM: bites under $10, $9 jumbo wings, oyster half-dozens $12–15, $10 cocktails and wine, $35 martini pitchers. A proper Monday reward.",
      Tuesday: "Happy hour 4–6 PM. $9 wings and $10 cocktails in one of Buckhead's most comfortable dining rooms.",
      Wednesday: "Happy hour 4–6 PM. $35 martini pitchers on a Wednesday — that's a mid-week plan worth making.",
      Thursday: "Happy hour 4–6 PM. Roshambo's bar is a local favorite before the weekend kicks in.",
      Friday: "Happy hour 4–6 PM. $9 wings, $10 cocktails, fresh oysters, and a great crowd to match.",
      Saturday: "",
      Sunday: "",
    },
    "https://roshamboatl.com/",
    img("1470337458703-46ad1756a187") // craft cocktails and appetizers
  ),
  createRestaurant(
    "North Italia",
    ["Buckhead"],
    "Italian",
    {
      Monday: "Bar happy hour 3–6 PM: $8 wine, $30 bottles, Garlic Knot Sliders $10, Margherita pizza $17, Meatballs $13. Italian happy hour done right.",
      Tuesday: "Bar happy hour 3–6 PM. $8 wine and $10 Garlic Knot Sliders are reason enough to show up.",
      Wednesday: "Bar happy hour 3–6 PM. $30 wine bottles at a white-tablecloth Italian spot — hard to beat.",
      Thursday: "Bar happy hour 3–6 PM. Meatballs, sliders, and $8 wine. The perfect Thursday tune-up.",
      Friday: "Bar happy hour 3–6 PM. Start the weekend with a $17 Margherita and a $30 bottle.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.northitalia.com/locations/atlanta-ga-buckhead/",
    img("1555396273-367ea4eb4db5") // Italian pasta dish
  ),
  createRestaurant(
    "White Bull",
    ["Decatur"],
    "American",
    {
      Monday: "Aperitivo Hour 4–6 PM: $10 pastas, $10 cocktails, $9 wine, $4–6 beer, $15 vermouth flight. A MICHELIN Bib Gourmand pick — Decatur's best happy hour.",
      Tuesday: "Aperitivo Hour 4–6 PM. $10 handmade pastas and $10 cocktails at a MICHELIN-recognized kitchen. Rare territory.",
      Wednesday: "Aperitivo Hour 4–6 PM. Build a charcuterie board and split a $15 vermouth flight mid-week.",
      Thursday: "Aperitivo Hour 4–6 PM. $9 wine and $10 handmade pasta in Decatur Square. A near-perfect Thursday.",
      Friday: "Aperitivo Hour 4–6 PM. Get there before the dinner crowd — $10 cocktails while they last.",
      Saturday: "Aperitivo Hour 4–6 PM. White Bull on a Saturday afternoon is worth the trip to Decatur.",
      Sunday: "Aperitivo Hour 4–6 PM. About as good as it gets on a Sunday in Decatur Square.",
    },
    "https://www.thewhitebullatl.com/",
    img("1550547660-37406b081d7a") // wine and cheese/charcuterie
  ),
  createRestaurant(
    "Tio Lucho's",
    ["Poncey-Highland"],
    "Peruvian",
    {
      Monday: "",
      Tuesday: "Low Tide Hour 4–6 PM: $1 oysters at the bar, $11 Chilcano pisco cocktail, $10 margarita, $5 Pilsen beer, Causitas and Yuca Fries. One of Atlanta's most inventive happy hours.",
      Wednesday: "Low Tide Hour 4–6 PM. $1 oysters and a Chilcano pisco cocktail in Poncey-Highland — a brilliant mid-week escape.",
      Thursday: "Low Tide Hour 4–6 PM. Peruvian coastal flavors at bar-deal prices. Don't sleep on this one.",
      Friday: "Low Tide Hour 4–6 PM. Ceviche, $1 oysters, and pisco to start the weekend. Yes, please.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.tioluchos.com/",
    img("1535400255456-984b4f2e8d49") // ceviche / coastal seafood
  ),
  createRestaurant(
    "Tin Lizzy's Cantina",
    ["Midtown", "Downtown"],
    "Mexican",
    {
      Monday: "Margarita Monday all day. Discounted margaritas to ease into the week — dine-in at any location.",
      Tuesday: "Taco Tuesday all day — $2.75 tacos, $3 PBR, $5 margaritas. One of Atlanta's best all-day taco deals.",
      Wednesday: "Happy hour 4–6 PM: $5 Queso Blanco, $4 Fried Pickles, $6 Loaded Tots. Plus Kids Eat Free all day.",
      Thursday: "Trifecta Thursday specials all day. Happy hour 4–6 PM with food and drink deals.",
      Friday: "Happy hour 4–6 PM. $5 Queso Blanco, $4 Fried Pickles, and $6 Loaded Tots to kick off the weekend.",
      Saturday: "",
      Sunday: "",
    },
    "https://tinlizzyscantina.com/",
    img("1552332386-f8dd00dc2f85") // loaded tacos / Mexican
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
  "Italian",
  "Mexican",
  "Mediterranean",
  "Peruvian",
  "Asian",
  "Seafood",
];
