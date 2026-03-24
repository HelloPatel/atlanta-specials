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
      Monday: "Daily happy hour until 5 PM: $6 glasses of wine & $6 pitchers of beer. Plus Board + Bottle after 8 PM — bruschetta board & bottle of wine for $25.",
      Tuesday: "Daily happy hour until 5 PM: $6 glasses of wine & $6 pitchers of beer. Plus Board + Bottle after 8 PM — bruschetta board & bottle of wine for $25.",
      Wednesday: "Daily happy hour until 5 PM: $6 glasses of wine & $6 pitchers of beer.",
      Thursday: "Daily happy hour until 5 PM: $6 glasses of wine & $6 pitchers of beer.",
      Friday: "Daily happy hour until 5 PM: $6 glasses of wine & $6 pitchers of beer.",
      Saturday: "Daily happy hour until 5 PM: $6 glasses of wine & $6 pitchers of beer.",
      Sunday: "Daily happy hour until 5 PM: $6 glasses of wine & $6 pitchers of beer.",
    },
    "https://www.postino.com/",
    "/images/postinos.webp"
  ),
  createRestaurant(
    "Gypsy Kitchen",
    ["Buckhead"],
    "American",
    {
      Monday: "Happy Hour 4–6 PM: $11 cocktails (Blackberry Mule, Seville Sunset, Just Peachy, Minted Ember), $8 wine (Sottal Vinho Leve & Cerejeiras Tinto), $8 J. Roget Brut. $5 patatas bravas & chicken croquetas. Flatbreads $9–$11.",
      Tuesday: "Happy Hour 4–6 PM: $11 cocktails, $8 wine & sparkling. $5 patatas bravas & chicken croquetas. Flatbreads $9–$11.",
      Wednesday: "Happy Hour 4–6 PM: $11 cocktails, $8 wine & sparkling. $5 patatas bravas & chicken croquetas. Flatbreads $9–$11.",
      Thursday: "Happy Hour 4–6 PM: $11 cocktails, $8 wine & sparkling. $5 patatas bravas & chicken croquetas. Flatbreads $9–$11.",
      Friday: "Happy Hour 4–6 PM: $11 cocktails, $8 wine & sparkling. $5 patatas bravas & chicken croquetas. Flatbreads $9–$11.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.gypsykitchenatl.com/",
    "/images/gypsy-kitchen.webp"
  ),
  createRestaurant(
    "The Iberian Pig",
    ["Buckhead", "Decatur"],
    "Mediterranean",
    {
      Monday: "Jamón Happy Hour 5–6 PM: Chef's Selection board (2 quesos + 2 charcuteria) $24. $6 red sangria, red wine & white wine. Add-ons: marinated olives $6, Marcona almonds $5, peppadew peppers $8.",
      Tuesday: "Jamón Happy Hour 5–6 PM: Chef's Selection board (2 quesos + 2 charcuteria) $24. $6 red sangria, red wine & white wine. Add-ons: marinated olives $6, Marcona almonds $5, peppadew peppers $8.",
      Wednesday: "Jamón Happy Hour 5–6 PM: Chef's Selection board (2 quesos + 2 charcuteria) $24. $6 red sangria, red wine & white wine. Add-ons: marinated olives $6, Marcona almonds $5, peppadew peppers $8.",
      Thursday: "Jamón Happy Hour 5–6 PM: Chef's Selection board (2 quesos + 2 charcuteria) $24. $6 red sangria, red wine & white wine. Add-ons: marinated olives $6, Marcona almonds $5, peppadew peppers $8.",
      Friday: "Jamón Happy Hour 4–6 PM: Chef's Selection board (2 quesos + 2 charcuteria) $24. $6 red sangria, red wine & white wine. Add-ons: marinated olives $6, Marcona almonds $5, peppadew peppers $8.",
      Saturday: "Jamón Happy Hour 4–6 PM: Chef's Selection board (2 quesos + 2 charcuteria) $24. $6 red sangria, red wine & white wine. Add-ons: marinated olives $6, Marcona almonds $5, peppadew peppers $8.",
      Sunday: "Jamón Happy Hour 5–6 PM: Chef's Selection board (2 quesos + 2 charcuteria) $24. $6 red sangria, red wine & white wine. Add-ons: marinated olives $6, Marcona almonds $5, peppadew peppers $8.",
    },
    "https://theiberianpig.com/",
    "/images/iberian-pig.webp"
  ),
  createRestaurant(
    "Industry Tavern",
    ["Buckhead"],
    "American",
    {
      Monday: "Drink specials all day (dine-in only): $5 draft beer & $6 Jack Daniel's.",
      Tuesday: "Drink specials all day (dine-in only): $5 Tito's Vodka.",
      Wednesday: "Drink specials all day (dine-in only): $6 El Tequileno & $5 Dos XX Lager.",
      Thursday: "Drink specials all day (dine-in only): $4 High Life & Coors Banquet.",
      Friday: "Drink specials all day (dine-in only): $6 Old Forester Bourbon & $6 Old Forester Rye.",
      Saturday: "Drink specials all day (dine-in only): $5 Sam Adams draft & $6 Sun Cruiser.",
      Sunday: "Drink specials all day (dine-in only): $5 Blue Moon draft & $6 High Noon cans.",
    },
    "https://www.industrytavern.com/weekly-specials/",
    "/images/industry-tavern.webp"
  ),
  createRestaurant(
    "Eclipse di Luna",
    ["Buckhead", "Dunwoody", "Alpharetta"],
    "Mediterranean",
    {
      Monday: "Happy Hour 4–6 PM at all locations. Buckhead: $7 tapas & $6 drinks + half-off wine bottles all night. Dunwoody: $5 tapas & $5 drinks + half-off wine all night.",
      Tuesday: "Happy Hour 4–6 PM at all locations. Buckhead: $7 tapas, $6 drinks, $6 margaritas all day. Dunwoody: $5 tapas & $5 drinks.",
      Wednesday: "Happy Hour 4–6 PM at all locations. Buckhead: $7 tapas, $6 drinks + half-off paellas all day. Dunwoody: $5 tapas & $5 drinks.",
      Thursday: "Happy Hour 4–6 PM at all locations. Buckhead: $7 tapas, $6 drinks, 20% off flight boards, free salsa dancing lessons. Dunwoody: $5 tapas & $5 drinks.",
      Friday: "Happy Hour 4–6 PM (Buckhead & Dunwoody). Buckhead: $7 tapas & $6 drinks + craft sandwich special & $18 sangria/mimosa carafes 11 AM–4 PM. Dunwoody: $5 tapas & $5 drinks.",
      Saturday: "Buckhead: $18 sangria & mimosa carafes, $8 espresso martinis, half-off coffee 12–4 PM. Dunwoody: bottomless mimosas & sangria 12–4 PM, full menu all day.",
      Sunday: "Buckhead: Spanish brunch menu + $18 sangria & mimosa carafes 12–4 PM. Dunwoody: bottomless mimosas & sangria 12–4 PM + half-off paellas all night.",
    },
    "https://eclipsediluna.com/buckhead-deal/",
    "/images/eclipse-di-luna.webp"
  ),
  createRestaurant(
    "5Church",
    ["Buckhead", "Midtown"],
    "American",
    {
      Monday: "Social Hour 3–7 PM (downstairs bar & patio): $1 oysters (min 6, dine-in), $7 duck fat croquettes, $8 devils on horseback, $12 lamb burger sliders, $14 ribs & wings, $19 flatbreads, and more.",
      Tuesday: "Social Hour 3–7 PM (downstairs bar & patio): $1 oysters (min 6, dine-in), $7 duck fat croquettes, $8 devils on horseback, $12 lamb burger sliders, $14 ribs & wings, $19 flatbreads, and more.",
      Wednesday: "Social Hour 3–7 PM (downstairs bar & patio): $1 oysters (min 6, dine-in), $7 duck fat croquettes, $8 devils on horseback, $12 lamb burger sliders, $14 ribs & wings, $19 flatbreads, and more.",
      Thursday: "Social Hour 3–7 PM (downstairs bar & patio): $1 oysters (min 6, dine-in), $7 duck fat croquettes, $8 devils on horseback, $12 lamb burger sliders, $14 ribs & wings, $19 flatbreads, and more.",
      Friday: "Social Hour 3–7 PM (downstairs bar & patio): $1 oysters (min 6, dine-in), $7 duck fat croquettes, $8 devils on horseback, $12 lamb burger sliders, $14 ribs & wings, $19 flatbreads, and more.",
      Saturday: "",
      Sunday: "",
    },
    "https://midtown.5church-atlanta.com/atlanta-midtown-5church-midtown-food-menu",
    "/images/5church.webp"
  ),
  createRestaurant(
    "Superica",
    ["Alpharetta"],
    "Mexican",
    {
      Monday: "Lunch menu 11 AM–3 PM (Alpharetta). Combo plates $13–$23: enchiladas, crispy tacos, quesadillas, blackened redfish tacos, huevos rancheros — all served with family-style rice & refried beans.",
      Tuesday: "Lunch menu 11 AM–3 PM (Alpharetta). Combo plates $13–$23 served with rice & refried beans.",
      Wednesday: "Lunch menu 11 AM–3 PM (Alpharetta). Combo plates $13–$23 served with rice & refried beans.",
      Thursday: "Lunch menu 11 AM–3 PM (Alpharetta). Combo plates $13–$23 served with rice & refried beans.",
      Friday: "Lunch menu 11 AM–3 PM (Alpharetta). Combo plates $13–$23 served with rice & refried beans.",
      Saturday: "",
      Sunday: "",
    },
    "https://superica.com/alpharetta/",
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
    "Fado's Irish Pub – Buckhead",
    ["Buckhead"],
    "American",
    {
      Monday: "Happy Hour 2–7 PM: $7 small plates (BBQ chicken flatbread, fish & chip cup, sausage rolls, corned beef rolls, quesadilla). $8 wines (Casa Lunardi, Riondo Prosecco, Portillo Malbec). $9 cocktails (Old Fashioned, Moscow Mule).",
      Tuesday: "Happy Hour 2–7 PM: $7 small plates (BBQ chicken flatbread, fish & chip cup, sausage rolls, corned beef rolls, quesadilla). $8 wines. $9 cocktails.",
      Wednesday: "Happy Hour 2–7 PM: $7 small plates (BBQ chicken flatbread, fish & chip cup, sausage rolls, corned beef rolls, quesadilla). $8 wines. $9 cocktails.",
      Thursday: "Happy Hour 2–7 PM: $7 small plates (BBQ chicken flatbread, fish & chip cup, sausage rolls, corned beef rolls, quesadilla). $8 wines. $9 cocktails.",
      Friday: "Happy Hour open–7 PM: $7 small plates (BBQ chicken flatbread, fish & chip cup, sausage rolls, corned beef rolls, quesadilla). $8 wines. $9 cocktails.",
      Saturday: "",
      Sunday: "",
    },
    "https://www.fadoirishpub.com/buckhead/",
    "/images/fado-irish-pub.webp"
  ),
  createRestaurant(
    "Fado's Irish Pub – Midtown",
    ["Midtown"],
    "American",
    {
      Monday: "Beers of the Month all day: $6 Truly Hard Seltzer Wildberry & $6 Sam Adams Seasonal.",
      Tuesday: "Beers of the Month all day: $6 Truly Hard Seltzer Wildberry & $6 Sam Adams Seasonal.",
      Wednesday: "Beers of the Month all day: $6 Truly Hard Seltzer Wildberry & $6 Sam Adams Seasonal.",
      Thursday: "Beers of the Month all day: $6 Truly Hard Seltzer Wildberry & $6 Sam Adams Seasonal.",
      Friday: "Beers of the Month all day: $6 Truly Hard Seltzer Wildberry & $6 Sam Adams Seasonal.",
      Saturday: "Beers of the Month all day: $6 Truly Hard Seltzer Wildberry & $6 Sam Adams Seasonal. Brunch With Benefits until 3 PM: $11 Signature Bloody Mary & $11 Irish Coffee.",
      Sunday: "Beers of the Month all day: $6 Truly Hard Seltzer Wildberry & $6 Sam Adams Seasonal. Brunch With Benefits until 3 PM: $11 Signature Bloody Mary & $11 Irish Coffee.",
    },
    "https://www.fadoirishpub.com/midtown/",
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
      Monday: "Happy Hour 3–6 PM (dine-in only): $9 oysters on the half shell, $12 chargrilled oysters, $19 seafood bucket. $10 cocktails, $8 wines by the glass, $5 beers & seltzers, 50% off wine bottles under $100. Bites from $5 (shrimp chips, edamame, spring rolls, satay, wings & more).",
      Tuesday: "Happy Hour 3–6 PM (dine-in only): $9 oysters on the half shell, $12 chargrilled oysters, $19 seafood bucket. $10 cocktails, $8 wines by the glass, $5 beers & seltzers, 50% off wine bottles under $100. Bites from $5 (shrimp chips, edamame, spring rolls, satay, wings & more).",
      Wednesday: "Happy Hour 3–6 PM (dine-in only): $9 oysters on the half shell, $12 chargrilled oysters, $19 seafood bucket. $10 cocktails, $8 wines by the glass, $5 beers & seltzers, 50% off wine bottles under $100. Bites from $5 (shrimp chips, edamame, spring rolls, satay, wings & more).",
      Thursday: "Happy Hour 3–6 PM (dine-in only): $9 oysters on the half shell, $12 chargrilled oysters, $19 seafood bucket. $10 cocktails, $8 wines by the glass, $5 beers & seltzers, 50% off wine bottles under $100. Bites from $5 (shrimp chips, edamame, spring rolls, satay, wings & more).",
      Friday: "Happy Hour 3–6 PM (dine-in only): $9 oysters on the half shell, $12 chargrilled oysters, $19 seafood bucket. $10 cocktails, $8 wines by the glass, $5 beers & seltzers, 50% off wine bottles under $100. Bites from $5 (shrimp chips, edamame, spring rolls, satay, wings & more).",
      Saturday: "",
      Sunday: "",
    },
    "https://www.snapthaiatl.com/menu",
    "/images/snap-thai.webp"
  ),
  createRestaurant(
    "Beetlecat",
    ["Inman Park"],
    "Seafood",
    {
      Monday: "Happy Hour 4–6 PM: oysters $3.60–$4 each (10 varieties), $10 Oyster Martini (mignonette gin, dry vermouth), $11 Fish House Punch, $6 Oyster Backs (mezcal or gin shooters). S.S. Minnow platter (6 oysters, 6 shrimp, crab salad, ceviche, snapper crudo) $70.",
      Tuesday: "Happy Hour 4–6 PM: oysters $3.60–$4 each (10 varieties), $10 Oyster Martini (mignonette gin, dry vermouth), $11 Fish House Punch, $6 Oyster Backs (mezcal or gin shooters). S.S. Minnow platter $70.",
      Wednesday: "Happy Hour 4–6 PM: oysters $3.60–$4 each (10 varieties), $10 Oyster Martini (mignonette gin, dry vermouth), $11 Fish House Punch, $6 Oyster Backs (mezcal or gin shooters). S.S. Minnow platter $70.",
      Thursday: "Happy Hour 4–6 PM: oysters $3.60–$4 each (10 varieties), $10 Oyster Martini (mignonette gin, dry vermouth), $11 Fish House Punch, $6 Oyster Backs (mezcal or gin shooters). S.S. Minnow platter $70.",
      Friday: "Happy Hour 4–6 PM: oysters $3.60–$4 each (10 varieties), $10 Oyster Martini (mignonette gin, dry vermouth), $11 Fish House Punch, $6 Oyster Backs (mezcal or gin shooters). S.S. Minnow platter $70.",
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
    "Chattahoochee Food Works",
    ["West Midtown"],
    "American",
    {
      Monday: "",
      Tuesday: "Georgia's Largest Happy Hour 4–6 PM! Deals across all vendors: $2.50 tacos (Taqueria La Luz), BOGO handrolls (Flying Fish), BOGO spring & egg rolls (Banh Mi Station), 3 wings + cornbread $10 (Delilah's), $2 baked bacon oysters (Fuzzy's Seafood), $8 marg & $8 patatas bravas (Tequila & Tapas), $5 potstickers (Saigon), $5 app sampler (Tyde Tate Kitchen), free tots with entrée (Farm Grill), loaded fries/tots $8 (Patty & Franks), $13 frito misto (Flora D'Italia), 3 mini arepas $8.50 (Papins Bites), $12 media noche (La Tropical), $5 strawberry milk tea (Unbelibubble), and more.",
      Wednesday: "",
      Thursday: "",
      Friday: "",
      Saturday: "",
      Sunday: "",
    },
    "https://www.chattahoocheefoodworks.com/",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"
  ),
  createRestaurant(
    "The Optimist",
    ["West Midtown"],
    "Seafood",
    {
      Monday: "",
      Tuesday: "",
      Wednesday: "",
      Thursday: "",
      Friday: "",
      Saturday: "Oyster Happy Hour 3–5 PM: select oysters on ice $1.75 each / Baker's Dozen $23. Small plates: deviled eggs $9, octopus ceviche $14, hamachi $18, razor clams $22, wood roasted oysters $24. Opti Burger $18, proper chips $8, chowder fries $18.",
      Sunday: "Oyster Happy Hour 3–5 PM: select oysters on ice $1.75 each / Baker's Dozen $23. Small plates: deviled eggs $9, octopus ceviche $14, hamachi $18, razor clams $22, wood roasted oysters $24. Opti Burger $18, proper chips $8, chowder fries $18.",
    },
    "https://theoptimistrestaurant.com/",
    "/images/the-optimist.webp"
  ),
  createRestaurant(
    "Close Company",
    ["West Midtown"],
    "American",
    {
      Monday: "Happy Hour 4–6 PM: $14.99 combo — one cocktail, one pastry pocket, and a salty side (popcorn or pickles).",
      Tuesday: "Happy Hour 4–6 PM: $14.99 combo — one cocktail, one pastry pocket, and a salty side (popcorn or pickles).",
      Wednesday: "Happy Hour 4–6 PM: $14.99 combo — one cocktail, one pastry pocket, and a salty side (popcorn or pickles).",
      Thursday: "Happy Hour 4–6 PM: $14.99 combo — one cocktail, one pastry pocket, and a salty side (popcorn or pickles).",
      Friday: "Happy Hour 4–6 PM: $14.99 combo — one cocktail, one pastry pocket, and a salty side (popcorn or pickles).",
      Saturday: "",
      Sunday: "",
    },
    "https://www.closecompanybar.com/",
    "/images/close-company.jpg"
  ),
  createRestaurant(
    "Talat Market",
    ["Summerhill"],
    "Asian",
    {
      Monday: "",
      Tuesday: "",
      Wednesday: "Happy Hour 5–7 PM: $5 mini-tinis.",
      Thursday: "Happy Hour 5–7 PM: $5 mini-tinis.",
      Friday: "",
      Saturday: "",
      Sunday: "Happy Hour 5–7 PM: $5 mini-tinis.",
    },
    "https://www.talatmarket.com/",
    "/images/talat-market.webp"
  ),
  createRestaurant(
    "Tin Lizzy's Cantina",
    ["Midtown", "Downtown"],
    "Mexican",
    {
      Monday: "Happy Hour 4–6 PM: $5 fried pickles, queso blanco, fried jalapeños & guacamole. $5 half-tray nachos, $8 margarita / $28 pitcher, $4 pint / $16 pitcher of TL Lager, $6 Lo Siento Tequila & Fireball shots.",
      Tuesday: "Taco Tuesday all day — $3.99 tacos (fried fish, grilled chicken, chicken con queso, kale & mushroom, The Gringo, fried chicken). $4 PBR tall boys & domestic drafts, $5 import drafts, $8 El Jimador margaritas.",
      Wednesday: "Happy Hour 4–6 PM: $5 fried pickles, queso blanco, fried jalapeños & guacamole. $5 half-tray nachos, $8 margarita / $28 pitcher, $4 pint / $16 pitcher of TL Lager, $6 shots.",
      Thursday: "Happy Hour 4–6 PM: $5 fried pickles, queso blanco, fried jalapeños & guacamole. $5 half-tray nachos, $8 margarita / $28 pitcher, $4 pint / $16 pitcher of TL Lager, $6 shots.",
      Friday: "Happy Hour 4–6 PM: $5 fried pickles, queso blanco, fried jalapeños & guacamole. $5 half-tray nachos, $8 margarita / $28 pitcher, $4 pint / $16 pitcher of TL Lager, $6 shots.",
      Saturday: "Brunch-Ish 11 AM–3 PM: breakfast tacos from $4.25 (bacon egg & cheese, chorizo & pico, steak 'n eggs). $5 Marg-Mosa, $6.50 Spicy Bloody Maria, $4.25 Michelada.",
      Sunday: "Brunch-Ish 11 AM–3 PM: breakfast tacos from $4.25 (bacon egg & cheese, chorizo & pico, steak 'n eggs). $5 Marg-Mosa, $6.50 Spicy Bloody Maria, $4.25 Michelada.",
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
