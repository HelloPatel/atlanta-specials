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
    img("1559339352-11d035aa65de") // fine dining atmosphere
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
    img("1559847844-5315695dadae") // fresh oysters on ice
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
  createRestaurant(
    "The Optimist",
    ["West Midtown"],
    "Seafood",
    {
      Monday: "$1 raw oysters at the oyster bar 5–6 PM. Selection changes daily — one of Atlanta's best raw bar deals.",
      Tuesday: "$1 raw oysters at the oyster bar 5–6 PM. Come early, seats go fast.",
      Wednesday: "$1 raw oysters 5–6 PM. The mid-week splurge that doesn't feel like one.",
      Thursday: "$1 raw oysters at the bar 5–6 PM. A Thursday ritual worth building around.",
      Friday: "$1 raw oysters at the oyster bar 5–6 PM. Kick off the weekend with fresh shells.",
      Saturday: "$1 raw oysters at the bar 3–5 PM. A rare weekend oyster deal.",
      Sunday: "$1 raw oysters at the bar 3–5 PM. Sunday done right.",
    },
    "https://www.theoptimistrestaurant.com/",
    img("1565557002-c3fc0c7d90dd") // oysters on ice
  ),
  createRestaurant(
    "O-Ku Sushi",
    ["West Midtown"],
    "Asian",
    {
      Monday: "Happy hour 5–6:30 PM: half-off sushi rolls ($7–$12), Miso Soup $3, Edamame $4, Rock Shrimp Tempura $11. Best sushi deal in Atlanta.",
      Tuesday: "Happy hour 5–6:30 PM: half-off specialty rolls and discounted small plates throughout the restaurant.",
      Wednesday: "Happy hour 5–6:30 PM: half-off sushi rolls. Wednesday's best reason to head to West Midtown.",
      Thursday: "Happy hour 5–6:30 PM: $7–$12 sushi rolls, $3 miso soup, $11 rock shrimp tempura.",
      Friday: "",
      Saturday: "",
      Sunday: "",
    },
    "https://www.o-kusushi.com/",
    img("1617196034183-421b4917c92d") // sushi rolls
  ),
  createRestaurant(
    "Forza Storico",
    ["West Midtown"],
    "Italian",
    {
      Monday: "",
      Tuesday: "½ price wine bottles all evening + Carbonara $26 (rigatoni, guanciale, pecorino, pasture-raised egg). Best wine deal in West Midtown.",
      Wednesday: "Roman Threeway $69 — choose any three pastas, no repeats. The ultimate pasta haul.",
      Thursday: "Gnocchi Alla Tua $22 — house-made ricotta gnocchi your way (sorrentina, margherita, or cacio e pepe). Thursdays only.",
      Friday: "",
      Saturday: "",
      Sunday: "",
    },
    "https://forzastorico.com/",
    img("1595295333158-4de2f28b5862") // pasta dish
  ),
  createRestaurant(
    "Hawkers Asian Street Food",
    ["Old Fourth Ward", "Perimeter"],
    "Asian",
    {
      Monday: "Happy hour 3–6 PM: half-off Baos and Beers, $3 off all spirits, $5 select small plates (Korean wings, wontons, egg rolls).",
      Tuesday: "Happy hour 3–6 PM: half-off Baos and Beers, $3 off spirits, $5 small plates. Asian street food at its most affordable.",
      Wednesday: "Happy hour 3–6 PM: half-off Baos and Beers, $3 off spirits, $5 small plates.",
      Thursday: "Happy hour 3–6 PM: half-off Baos and Beers, $3 off spirits, $5 small plates.",
      Friday: "",
      Saturday: "",
      Sunday: "",
    },
    "https://eathawkers.com/",
    img("1569050467447-ce54b3bbc37d") // Asian street food bao
  ),
  createRestaurant(
    "Sweet Auburn BBQ",
    ["Poncey-Highland"],
    "American",
    {
      Monday: "Happy hour 3–6 PM: drink deals on Tropicalia, PBR, High Life, 4 Roses Bourbon; wings, ribs, BBQ tacos, sliders on special.",
      Tuesday: "Happy hour 3–6 PM + Taco Tuesday all day: $2 BBQ tacos, $2 Tecates, $2 marg shots. A Tuesday worth planning for.",
      Wednesday: "Happy hour 3–6 PM: drink specials and BBQ bar bites at reduced prices.",
      Thursday: "Happy hour 3–6 PM + 4 Roses Bourbon cocktails $6 all day. A bourbon lover's Thursday.",
      Friday: "Happy hour 3–6 PM: drink deals and BBQ bites to kick off the weekend.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.sweetauburnbbq.com/",
    img("1529193591184-b1d58069ecdd") // BBQ brisket
  ),
  createRestaurant(
    "Twisted Soul Cookhouse & Pours",
    ["West Midtown"],
    "American",
    {
      Monday: "",
      Tuesday: "",
      Wednesday: "Winedown Wednesday: half-off select bottles of wine + complimentary charcuterie board. A MICHELIN-listed spot doing Wine Wednesday right.",
      Thursday: "Happy hour cocktails $8. Creative Southern cocktails at their most accessible.",
      Friday: "Happy hour cocktails $8. Twisted Soul's inventive bar program at happy hour prices.",
      Saturday: "Brunch service. One of Atlanta's best brunch destinations.",
      Sunday: "Brunch service. Close out the weekend with inventive Southern cooking.",
    },
    "https://www.twistedsoulatl.com/",
    img("1514190051997-0f6f39ca5cde") // Southern fried chicken
  ),
  createRestaurant(
    "Wrecking Bar Brewpub",
    ["Little Five Points"],
    "American",
    {
      Monday: "",
      Tuesday: "Happy hour 5–7 PM: $6 house-brewed craft beers and cocktails. A Victorian mansion turned brewpub — a L5P institution.",
      Wednesday: "Happy hour 5–7 PM: $6 drink specials. Mid-week beers in one of Atlanta's most unique spaces.",
      Thursday: "Happy hour 5–7 PM: $6 drink specials on craft beers and cocktails.",
      Friday: "Happy hour 5–7 PM: $6 drink specials to kick off the weekend L5P style.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.wreckingbarbrewpub.com/",
    img("1436076863939-06870fe779c2") // craft beer pints
  ),
  createRestaurant(
    "Torchy's Tacos",
    ["Westside"],
    "Mexican",
    {
      Monday: "Hooky Hour 2–6 PM: all beers and cocktails 50% off, $6 apps (Street Tacos Trio, Diablo Chicken Bites, Green Chile Pork Taquitos), $4 mocktails.",
      Tuesday: "Hooky Hour 2–6 PM: half-price drinks, $6 apps. Four solid hours of deals.",
      Wednesday: "Hooky Hour 2–6 PM: 50% off all beers and cocktails + $6 street taco trio.",
      Thursday: "Hooky Hour 2–6 PM: half-price drinks and $6 apps. A solid pre-dinner window.",
      Friday: "Hooky Hour 2–6 PM: half-price drinks, $6 apps to launch your Friday.",
      Saturday: "",
      Sunday: "",
    },
    "https://torchystacos.com/",
    img("1565299507177-b0ac66763828") // tacos
  ),
  createRestaurant(
    "Two Urban Licks",
    ["Old Fourth Ward"],
    "American",
    {
      Monday: "Happy hour 5–8 PM: drink specials and ½ price tapas. Three full hours at one of Atlanta's most vibrant dining rooms.",
      Tuesday: "Happy hour 5–8 PM: drink specials and half-price tapas.",
      Wednesday: "Happy hour 5–8 PM: ½ price tapas and drink deals. Mid-week crowd-watching at its finest.",
      Thursday: "Happy hour 5–8 PM: drink specials and ½ price tapas.",
      Friday: "Happy hour 5–8 PM: ½ price tapas and drink specials. Three solid hours to kick off your Friday.",
      Saturday: "Brunch Sat 11 AM–3 PM. Two Urban Licks is an Atlanta institution.",
      Sunday: "Sunday brunch 11 AM–3 PM with live music and great food.",
    },
    "https://www.twourbanlicks.com/",
    img("1414235077428-338989a2e8c0") // upscale dining room
  ),
  createRestaurant(
    "Botica",
    ["Buckhead"],
    "Mexican",
    {
      Monday: "Happy hour 3–6 PM: $5 tapas (oysters, taquitos, empanadas), $5 margaritas, $5 mimosas, $5 mojitos, $5 sangria. One of Atlanta's best happy hour values.",
      Tuesday: "Happy hour 3–6 PM: $5 tapas, $5 margaritas, $5 sangria. Hard to beat.",
      Wednesday: "Happy hour 3–6 PM: $5 tapas, $5 cocktails. Mid-week Mexican with a patio.",
      Thursday: "Happy hour 3–6 PM: $5 tapas and $5 margaritas. The perfect pre-weekend warm-up.",
      Friday: "Happy hour 3–6 PM: $5 tapas, $5 margaritas, $5 mimosas.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.eatbotica.com/",
    img("1551504734-5ee1c4a1479b") // margaritas & Mexican
  ),
  createRestaurant(
    "Lure",
    ["Midtown"],
    "Seafood",
    {
      Monday: "Happy hour 4–6 PM: $7 cocktails and wine, half-price oysters, half-price crispy shrimp, half-price caviar eggs. Midtown's best seafood happy hour.",
      Tuesday: "Happy hour 4–6 PM: half-price oysters, $7 drinks. Lure's converted 1920s bungalow is the setting.",
      Wednesday: "Happy hour 4–6 PM: half-price oysters, crispy shrimp, caviar eggs, $7 cocktails.",
      Thursday: "Happy hour 4–6 PM: half-price oysters and seafood bites, $7 drinks.",
      Friday: "Happy hour 4–6 PM: half-price oysters and shrimp, $7 cocktails.",
      Saturday: "Happy hour 4–6 PM. Lure keeps the deal going on Saturdays — rare and worth it.",
      Sunday: "",
    },
    "https://www.lure-atlanta.com/",
    img("1565557002-c3fc0c7d90dd") // seafood oysters
  ),
  createRestaurant(
    "Ecco",
    ["Midtown", "Buckhead"],
    "American",
    {
      Monday: "Happy hour 4–6 PM at the bar: $7 cocktails, $7 wine by the glass, Ricotta Arancini with Truffle Aioli $11, discounted charcuterie and cheese boards.",
      Tuesday: "Happy hour 4–6 PM: $7 cocktails and wine, $11 arancini. European-inspired bar snacks and cocktails.",
      Wednesday: "Happy hour 4–6 PM: $7 drinks, $11 arancini. Ecco's polished bar snacks mid-week.",
      Thursday: "Happy hour 4–6 PM: $7 cocktails, $7 wine, discounted bar snacks.",
      Friday: "Happy hour 4–6 PM: $7 cocktails and wine with chef-driven small plates.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.ecco-atlanta.com/",
    img("1559339352-11d035aa65de") // fine dining bar
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
