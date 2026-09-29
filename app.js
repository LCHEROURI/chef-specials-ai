const cuisines = ["Greek", "French", "American", "Chinese", "Italian"];

const sourceDishes = {
  Greek: [
    {
      name: "Seared Branzino with Lemon-Oregano Potatoes and Fennel Olive Relish",
      caption: "Fresh branzino seared until crisp and served over roasted lemon-oregano potatoes, finished with fennel, olive, parsley, and extra-virgin olive oil.",
      ingredients: ["Branzino", "Yukon potatoes", "Lemon", "Oregano", "Fennel", "Kalamata olives", "Parsley", "Olive oil"],
      cost: 12.75,
      price: 36,
      overview: "Pan-sear fillets to order, roast potatoes ahead, and finish with a bright raw relish.",
      why: "Feels coastal and polished, uses familiar Greek flavors, and keeps pickup fast during dinner service.",
      pairing: "Assyrtiko, dry rose, or a cucumber-mint gin spritz."
    },
    {
      name: "Charred Lamb Kofta with Smoked Eggplant, Tomato Jam, and Mint Yogurt",
      caption: "Spiced lamb kofta grilled over high heat with silky smoked eggplant, warm tomato jam, herbs, and cool mint yogurt.",
      ingredients: ["Ground lamb", "Eggplant", "Greek yogurt", "Mint", "Tomato", "Cumin", "Coriander", "Pita"],
      cost: 9.9,
      price: 31,
      overview: "Shape kofta in advance, grill to order, and plate with prepared spreads and herbs.",
      why: "High perceived value with controlled protein cost and a dramatic charred aroma.",
      pairing: "Xinomavro, Syrah, or a lemon-forward lager."
    },
    {
      name: "Honey-Roasted Carrot Saganaki with Whipped Feta and Pistachio Dukkah",
      caption: "Roasted carrots glazed with thyme honey, served over whipped feta with pistachio dukkah, citrus, and dill.",
      ingredients: ["Carrots", "Feta", "Greek yogurt", "Honey", "Pistachios", "Sesame", "Dill", "Orange"],
      cost: 4.6,
      price: 19,
      overview: "Roast carrots in batches, hold whipped feta cold, and finish with dukkah and herbs.",
      why: "A profitable vegetarian special that still reads luxurious and seasonal.",
      pairing: "Moschofilero, sparkling wine, or a rosemary lemonade."
    }
  ],
  French: [
    {
      name: "Duck Breast with Cherry Gastrique, Potato Pavé, and Haricots Verts",
      caption: "Crisp-skinned duck breast sliced over potato pavé with haricots verts and a glossy cherry gastrique.",
      ingredients: ["Duck breast", "Potatoes", "Cream", "Cherries", "Sherry vinegar", "Haricots verts", "Thyme"],
      cost: 13.8,
      price: 39,
      overview: "Render duck to order, reheat pavé portions, and sauce with a reduced fruit gastrique.",
      why: "Classic French technique, elegant plate presence, and strong dinner-special value.",
      pairing: "Pinot Noir, Beaujolais Cru, or a dry cider."
    },
    {
      name: "Halibut à la Grenobloise with Brown Butter Cauliflower and Capers",
      caption: "Pan-roasted halibut finished with brown butter, lemon, capers, parsley, and crisp cauliflower.",
      ingredients: ["Halibut", "Butter", "Lemon", "Capers", "Parsley", "Cauliflower", "Shallot"],
      cost: 14.5,
      price: 42,
      overview: "Sear fish to order, roast cauliflower ahead, and finish with classic grenobloise garnish.",
      why: "Light, premium, and recognizable without becoming fussy.",
      pairing: "Chablis, Sancerre, or a French 75."
    },
    {
      name: "Mushroom Vol-au-Vent with Cognac Cream and Frisée",
      caption: "Buttery puff pastry filled with roasted mushrooms, cognac cream, fines herbes, and a crisp frisée salad.",
      ingredients: ["Puff pastry", "Cremini mushrooms", "Oyster mushrooms", "Cream", "Cognac", "Frisée", "Chives"],
      cost: 5.85,
      price: 23,
      overview: "Bake pastry shells before service and fill with hot mushroom ragout to order.",
      why: "A margin-friendly French vegetarian option with a fine-dining feel.",
      pairing: "White Burgundy, Champagne, or a vermouth spritz."
    }
  ],
  American: [
    {
      name: "Coffee-Rubbed Ribeye with Bourbon Shallot Butter and Crispy Fingerlings",
      caption: "Grilled ribeye with a savory coffee crust, bourbon-shallot compound butter, crispy fingerlings, and charred broccolini.",
      ingredients: ["Ribeye", "Coffee", "Brown sugar", "Bourbon", "Shallot", "Butter", "Fingerlings", "Broccolini"],
      cost: 18.2,
      price: 52,
      overview: "Rub steaks before service, grill to temperature, and finish with compound butter.",
      why: "Premium American steakhouse energy with excellent upsell potential.",
      pairing: "Cabernet Sauvignon, rye Old Fashioned, or porter."
    },
    {
      name: "Seared Scallops with Sweet Corn Purée, Bacon Jam, and Pickled Peppers",
      caption: "Golden sea scallops over sweet corn purée with smoky bacon jam, pickled peppers, and micro herbs.",
      ingredients: ["Sea scallops", "Corn", "Cream", "Bacon", "Peppers", "Apple cider vinegar", "Chives"],
      cost: 13.4,
      price: 38,
      overview: "Sear scallops to order while holding purée and bacon jam warm.",
      why: "Balanced sweet, smoky, and bright flavors make this an easy guest favorite.",
      pairing: "Chardonnay, sparkling wine, or a corn-silk sour."
    },
    {
      name: "Maple-Miso Roasted Chicken with Carrot Purée and Brussels Slaw",
      caption: "Roasted airline chicken breast glazed with maple miso, served with carrot purée and shaved Brussels slaw.",
      ingredients: ["Airline chicken", "Maple syrup", "Miso", "Carrots", "Brussels sprouts", "Apple", "Dijon"],
      cost: 7.35,
      price: 29,
      overview: "Roast chicken portions, glaze near pickup, and plate with prepared purée and slaw.",
      why: "Comforting, profitable, and polished enough for upscale casual service.",
      pairing: "Viognier, amber ale, or a maple whiskey highball."
    }
  ],
  Chinese: [
    {
      name: "Tea-Smoked Duck with Plum Hoisin, Scallion Pancake, and Pickled Cucumber",
      caption: "Tender tea-smoked duck with plum hoisin, crisp scallion pancake, cucumber pickle, and toasted sesame.",
      ingredients: ["Duck", "Black tea", "Rice", "Brown sugar", "Hoisin", "Plums", "Scallions", "Cucumber"],
      cost: 12.6,
      price: 37,
      overview: "Smoke and roast duck ahead, crisp portions to order, and serve with warm pancake.",
      why: "Aromatic, theatrical, and upscale while using batch-friendly prep.",
      pairing: "Pinot Noir, jasmine tea highball, or lager."
    },
    {
      name: "Ginger-Scallion Steamed Cod with Silken Tofu and Chili Crisp",
      caption: "Delicate cod steamed with ginger and scallion over silken tofu, finished with hot soy, herbs, and house chili crisp.",
      ingredients: ["Cod", "Silken tofu", "Ginger", "Scallion", "Soy sauce", "Chili crisp", "Cilantro"],
      cost: 10.8,
      price: 34,
      overview: "Steam fish portions to order and finish with hot seasoned oil and soy.",
      why: "Clean, elegant, fast to execute, and ideal for guests seeking lighter seafood.",
      pairing: "Riesling, sake, or sparkling jasmine tea."
    },
    {
      name: "Five-Spice Short Rib with Charred Bok Choy and Black Vinegar Jus",
      caption: "Slow-braised short rib lacquered with five-spice glaze, charred bok choy, garlic rice, and black vinegar jus.",
      ingredients: ["Beef short rib", "Five spice", "Shaoxing wine", "Black vinegar", "Bok choy", "Garlic", "Rice"],
      cost: 11.9,
      price: 35,
      overview: "Braise short rib ahead, glaze during pickup, and plate with hot rice and vegetables.",
      why: "Deep flavor, easy service pickup, and excellent use of a braised premium-feeling cut.",
      pairing: "Malbec, baijiu cocktail, or dark lager."
    }
  ],
  Italian: [
    {
      name: "Squid Ink Tagliolini with Lobster, Calabrian Chili, and Preserved Lemon",
      caption: "Fresh squid ink pasta tossed with lobster, white wine, Calabrian chili, preserved lemon, and parsley.",
      ingredients: ["Squid ink pasta", "Lobster", "White wine", "Calabrian chili", "Preserved lemon", "Parsley", "Butter"],
      cost: 15.5,
      price: 44,
      overview: "Par-cook pasta, warm lobster gently in sauce, and finish glossy with butter.",
      why: "Dramatic color, premium seafood, and a guest-facing caption that sells itself.",
      pairing: "Vermentino, Franciacorta, or a bitter citrus spritz."
    },
    {
      name: "Veal Saltimbocca with Sage Marsala Jus and Creamy Polenta",
      caption: "Tender veal scaloppine layered with prosciutto and sage, served over creamy polenta with Marsala jus.",
      ingredients: ["Veal", "Prosciutto", "Sage", "Marsala", "Polenta", "Parmesan", "Butter"],
      cost: 12.4,
      price: 36,
      overview: "Sear scaloppine to order, hold polenta warm, and reduce pan sauce quickly.",
      why: "Classic, fast, and indulgent without overcomplicating the station.",
      pairing: "Chianti Classico, Barbera, or an amaro spritz."
    },
    {
      name: "Roasted Delicata Risotto with Taleggio, Hazelnut, and Brown Butter",
      caption: "Creamy risotto folded with roasted delicata squash, Taleggio, brown butter, toasted hazelnuts, and fried sage.",
      ingredients: ["Arborio rice", "Delicata squash", "Taleggio", "Hazelnuts", "Sage", "Brown butter", "Vegetable stock"],
      cost: 6.8,
      price: 27,
      overview: "Par-cook risotto base, finish à la minute with squash, cheese, and stock.",
      why: "A luxurious vegetarian special with strong margin and seasonal comfort.",
      pairing: "Soave Classico, orange wine, or a nonalcoholic pear shrub."
    }
  ]
};

const seasonalGarnishes = {
  Greek: ["charred Meyer lemon", "pickled summer fennel", "pomegranate seeds and fresh mint", "crisp autumn oregano"],
  French: ["spring ramps and chervil", "shaved summer black truffle", "autumn roasted chanterelles", "winter pickled mustard seeds"],
  American: ["sweet summer corn relish", "autumn spiced apple slaw", "winter pickled cranberries", "spring ramp butter"],
  Chinese: ["spring bamboo shoots", "summer pickled ginger", "autumn persimmon slices", "winter preserved black radish"],
  Italian: ["spring fava leaves", "summer heirloom tomato conserva", "autumn fried sage and chestnuts", "winter preserved blood orange"]
};

const specialParts = {
  Greek: {
    proteins: [
      { name: "branzino", category: "seafood", cost: 13.2 },
      { name: "dayboat scallops", category: "seafood", cost: 14.4 },
      { name: "lamb loin", category: "meat", cost: 12.8 },
      { name: "chicken souvlaki", category: "poultry", cost: 6.9 },
      { name: "crispy halloumi", category: "vegetarian", cost: 4.8 },
      { name: "cauliflower steak", category: "vegetarian", cost: 4.2 },
      { name: "braised lamb orzo", category: "pasta", cost: 10.8 },
      { name: "mushroom hilopites", category: "pasta", cost: 6.4 }
    ],
    techniques: ["Seared", "Charred", "Herb-Roasted", "Grilled", "Olive-Oil Poached"],
    bases: ["lemon-oregano potatoes", "smoked eggplant puree", "orzo pilaf", "warm gigante beans", "fennel and cucumber salad"],
    sauces: ["whipped feta", "tomato ouzo butter", "mint yogurt", "caper-raisin relish", "saffron avgolemono"],
    garnishes: ["pistachio dukkah", "dill oil", "Kalamata olive crumbs", "charred lemon", "crispy oregano"],
    pairings: ["Assyrtiko, dry rose, or a cucumber-mint gin spritz.", "Xinomavro, pilsner, or rosemary lemonade.", "Moschofilero, sparkling wine, or a citrus tonic."]
  },
  French: {
    proteins: [
      { name: "duck breast", category: "poultry", cost: 13.8 },
      { name: "halibut", category: "seafood", cost: 14.6 },
      { name: "sea scallops", category: "seafood", cost: 13.9 },
      { name: "steak frites cut", category: "meat", cost: 16.5 },
      { name: "wild mushroom tart", category: "vegetarian", cost: 5.9 },
      { name: "cauliflower pave", category: "vegetarian", cost: 4.6 },
      { name: "duck confit ravioles", category: "pasta", cost: 11.2 },
      { name: "truffle potato gnocchi", category: "pasta", cost: 7.8 }
    ],
    techniques: ["Pan-Roasted", "Brown-Butter Basted", "Confit", "Herb-Crusted", "Sear-Roasted"],
    bases: ["potato pave", "celery root puree", "lentils du Puy", "truffle pommes puree", "frisee and apple salad"],
    sauces: ["cherry gastrique", "cognac cream", "sauce verte", "black pepper bordelaise", "lemon caper beurre noisette"],
    garnishes: ["fried shallots", "fines herbes", "pickled mustard seed", "hazelnut crumbs", "crispy leeks"],
    pairings: ["Pinot Noir, Beaujolais Cru, or dry cider.", "Chablis, Sancerre, or a French 75.", "White Burgundy, Champagne, or a vermouth spritz."]
  },
  American: {
    proteins: [
      { name: "ribeye", category: "meat", cost: 18.4 },
      { name: "short rib", category: "meat", cost: 11.6 },
      { name: "sea scallops", category: "seafood", cost: 13.4 },
      { name: "airline chicken", category: "poultry", cost: 7.4 },
      { name: "blackened salmon", category: "seafood", cost: 10.9 },
      { name: "squash steak", category: "vegetarian", cost: 4.7 },
      { name: "lobster mac and cheese", category: "pasta", cost: 14.6 },
      { name: "short rib pappardelle", category: "pasta", cost: 11.9 }
    ],
    techniques: ["Coffee-Rubbed", "Bourbon-Glazed", "Wood-Grilled", "Cast-Iron Seared", "Maple-Miso Roasted"],
    bases: ["crispy fingerlings", "sweet corn puree", "smoked cheddar grits", "Brussels slaw", "buttermilk mashed potatoes"],
    sauces: ["bourbon shallot butter", "bacon jam", "peppercorn jus", "apple cider gastrique", "charred scallion ranch"],
    garnishes: ["pickled peppers", "crispy onions", "micro celery", "toasted pecans", "hot honey drizzle"],
    pairings: ["Cabernet Sauvignon, rye Old Fashioned, or porter.", "Chardonnay, sparkling wine, or a corn-silk sour.", "Viognier, amber ale, or a maple whiskey highball."]
  },
  Chinese: {
    proteins: [
      { name: "tea-smoked duck", category: "poultry", cost: 12.7 },
      { name: "steamed cod", category: "seafood", cost: 10.9 },
      { name: "five-spice short rib", category: "meat", cost: 11.8 },
      { name: "Sichuan prawns", category: "seafood", cost: 12.4 },
      { name: "mapo eggplant", category: "vegetarian", cost: 4.5 },
      { name: "crispy tofu", category: "vegetarian", cost: 3.9 },
      { name: "Dan Dan hand-pulled noodles", category: "pasta", cost: 7.6 },
      { name: "braised beef noodle bowl", category: "pasta", cost: 8.9 }
    ],
    techniques: ["Wok-Seared", "Ginger-Steamed", "Tea-Smoked", "Red-Braised", "Chili-Lacquered"],
    bases: ["garlic jasmine rice", "scallion pancake", "silken tofu", "charred bok choy", "sesame noodles"],
    sauces: ["plum hoisin", "black vinegar jus", "ginger-scallion oil", "mala chili crisp", "Shaoxing soy glaze"],
    garnishes: ["pickled cucumber", "toasted sesame", "fried garlic", "cilantro stems", "crispy shallots"],
    pairings: ["Riesling, sake, or sparkling jasmine tea.", "Pinot Noir, jasmine tea highball, or lager.", "Malbec, baijiu cocktail, or dark lager."]
  },
  Italian: {
    proteins: [
      { name: "lobster", category: "seafood", cost: 15.8 },
      { name: "veal scaloppine", category: "meat", cost: 12.5 },
      { name: "wild boar ragu", category: "meat", cost: 10.8 },
      { name: "branzino", category: "seafood", cost: 13.4 },
      { name: "delicata squash", category: "vegetarian", cost: 4.8 },
      { name: "porcini mushroom", category: "vegetarian", cost: 6.2 },
      { name: "squid ink tagliolini with lobster", category: "pasta", cost: 15.4 },
      { name: "wild boar pappardelle", category: "pasta", cost: 11.2 },
      { name: "delicata squash ravioli", category: "pasta", cost: 7.2 }
    ],
    techniques: ["Calabrian Chili", "Brown-Butter", "Sage-Roasted", "Marsala-Glazed", "Preserved-Lemon"],
    bases: ["squid ink tagliolini", "creamy polenta", "saffron risotto", "charred broccolini", "hand-cut pappardelle"],
    sauces: ["white wine butter", "Taleggio fonduta", "tomato conserva", "Marsala jus", "basil pistou"],
    garnishes: ["fried sage", "toasted hazelnut", "preserved lemon", "Parmesan frico", "Calabrian breadcrumbs"],
    pairings: ["Vermentino, Franciacorta, or a bitter citrus spritz.", "Chianti Classico, Barbera, or an amaro spritz.", "Soave Classico, orange wine, or a nonalcoholic pear shrub."]
  }
};

let selectedCuisine = "Greek";
let activeFilters = new Set(["Seasonal"]);
let currentSpecials = [];
let selectedSpecial = null;
let memorySavedSpecials = [];
let generationCounter = 0;
let recentSpecialNames = [];

const cuisineList = document.querySelector("#cuisineList");
const savedList = document.querySelector("#savedList");
const specialsList = document.querySelector("#specialsList");
const chefRequest = document.querySelector("#chefRequest");
const specialsHeading = document.querySelector("#specialsHeading");
const generationMeta = document.querySelector("#generationMeta");
const recipePanel = document.querySelector("#recipePanel");

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function margin(cost, price) {
  return `${Math.round(((price - cost) / price) * 100)}%`;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function titleCase(text) {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRequestedCount(request) {
  if (/\b(one|1)\b/.test(request)) return 1;
  if (/\b(two|2)\b/.test(request)) return 2;
  if (/\b(four|4)\b/.test(request)) return 4;
  if (/\b(five|5)\b/.test(request)) return 5;
  return 3;
}

function desiredCategory(request) {
  if (activeFilters.has("Pasta") || request.includes("pasta") || request.includes("noodle") || request.includes("ravioli") || request.includes("tagliolini") || request.includes("pappardelle") || request.includes("orzo")) return "pasta";
  if (activeFilters.has("Seafood") || request.includes("seafood") || request.includes("fish")) return "seafood";
  if (activeFilters.has("Vegetarian") || request.includes("vegetarian") || request.includes("vegetable")) return "vegetarian";
  if (activeFilters.has("Poultry") || request.includes("chicken") || request.includes("poultry") || request.includes("duck")) return "poultry";
  if (activeFilters.has("Meat") || request.includes("meat") || request.includes("steak") || request.includes("beef") || request.includes("lamb") || request.includes("pork") || request.includes("veal")) return "meat";
  return "";
}

function buildGeneratedSpecial(cuisine, request, usedNames) {
  const parts = specialParts[cuisine];
  const category = desiredCategory(request);
  let proteins = category ? parts.proteins.filter((protein) => protein.category === category) : [...parts.proteins];

  if (activeFilters.has("Low food cost")) {
    proteins = proteins.sort((a, b) => a.cost - b.cost).slice(0, 3);
  } else if (activeFilters.has("Premium special")) {
    proteins = proteins.sort((a, b) => b.cost - a.cost).slice(0, 3);
  }

  if (!proteins.length) proteins = [...parts.proteins];

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const protein = randomItem(proteins);
    const technique = randomItem(parts.techniques);
    const base = randomItem(parts.bases);
    const sauce = randomItem(parts.sauces);
    const garnish = activeFilters.has("Seasonal") && seasonalGarnishes[cuisine]
      ? randomItem(seasonalGarnishes[cuisine])
      : randomItem(parts.garnishes);

    const name = `${technique} ${titleCase(protein.name)} with ${titleCase(base)}, ${titleCase(sauce)}, and ${titleCase(garnish)}`;

    if (usedNames.has(name) || recentSpecialNames.includes(name)) continue;

    const cost = Number((protein.cost + 1.8 + Math.random() * 2.8).toFixed(2));
    const multiplier = activeFilters.has("Low food cost") ? 3.8 : activeFilters.has("Premium special") ? 3.15 : 3.35;
    const price = Math.ceil((cost * multiplier + 4) / 2) * 2 - 1;

    const seasonalTag = activeFilters.has("Seasonal") ? " seasonal" : "";

    return {
      name,
      caption: `${titleCase(protein.name)} prepared ${technique.toLowerCase()} and served with ${base}, ${sauce}, ${garnish}, and a polished${seasonalTag} ${cuisine.toLowerCase()} dinner-service finish.`,
      ingredients: [
        titleCase(protein.name),
        titleCase(base),
        titleCase(sauce),
        titleCase(garnish),
        "Fresh herbs",
        "Citrus",
        "Olive oil",
        "Finishing salt"
      ],
      cost,
      price,
      overview: `${technique} the ${protein.name} to order, hold the ${base} warm, and finish the plate with ${sauce} and ${garnish}.`,
      why: `Fresh ${category || protein.category} direction with practical prep, clear menu language, and a margin-conscious ${cuisine.toLowerCase()} profile.`,
      pairing: randomItem(parts.pairings)
    };
  }

  // Safe fallback to sourceDishes without reusing current batch names
  const availableSource = sourceDishes[cuisine].filter(d => !usedNames.has(d.name));
  const fallback = availableSource.length ? randomItem(availableSource) : randomItem(sourceDishes[cuisine]);
  return { ...fallback, ingredients: [...fallback.ingredients] };
}

function measuredIngredient(ingredient, index) {
  const measures = {
    // Seafood
    Branzino: "4 branzino fillets, 5 to 6 oz each",
    "Dayboat scallops": "16 large dayboat sea scallops (approx. 1 1/4 lb)",
    "Sea scallops": "16 large sea scallops (approx. 1 1/4 lb)",
    Halibut: "4 halibut portions, 6 oz each",
    Cod: "4 cod fillets, 6 oz each",
    "Steamed cod": "4 cod fillets, 6 oz each",
    Lobster: "12 oz cooked lobster meat, gently chopped",
    "Blackened salmon": "4 salmon fillets, 6 oz each",
    "Sichuan prawns": "16 wild jumbo prawns, peeled and deveined",
    // Meat
    "Lamb loin": "4 lamb loins, 6 oz each, trimmed",
    "Ground lamb": "1 1/4 lb ground lamb",
    "Steak frites cut": "4 hanger or flank steaks, 7 oz each",
    Ribeye: "4 boneless ribeye steaks, 12 oz each",
    "Short rib": "4 braised bone-in beef short ribs (approx. 10 oz each)",
    "Five-spice short rib": "4 braised beef short ribs (approx. 10 oz each)",
    "Beef short rib": "4 braised beef short ribs (approx. 10 oz each)",
    Veal: "1 lb veal scaloppine, pounded thin",
    "Veal scaloppine": "1 lb veal scaloppine, pounded thin",
    Prosciutto: "4 thin slices prosciutto di Parma",
    "Wild boar ragu": "2 cups slow-braised wild boar ragu",
    // Poultry
    "Duck breast": "4 Moulard or Pekin duck breasts, scored",
    Duck: "4 duck leg confits or breasts",
    "Tea-smoked duck": "1 whole tea-smoked duck, portioned",
    "Chicken souvlaki": "1 1/2 lb chicken thighs, diced and skewered",
    "Airline chicken": "4 airline chicken breasts (skin-on, bone-in)",
    // Vegetarian & Cheese
    "Crispy halloumi": "8 slices halloumi cheese (approx. 10 oz)",
    "Cauliflower steak": "4 thick-cut cauliflower steaks",
    "Cauliflower pave": "4 square portions cauliflower pavé",
    "Wild mushroom tart": "4 individual puff pastry mushroom tarts",
    "Squash steak": "4 thick-cut roasted butternut squash steaks",
    "Mapo eggplant": "3 Chinese eggplants, cut into bite-sized wedges",
    "Crispy tofu": "14 oz extra-firm tofu, pressed and cubed",
    "Delicata squash": "1 1/2 lb delicata squash, seeded and roasted",
    "Porcini mushroom": "8 oz fresh porcini or cremini mushrooms, sliced",
    Carrots: "1 1/2 lb baby carrots, trimmed",
    Feta: "6 oz Greek feta cheese, crumbled",
    "Greek yogurt": "1 cup whole-milk Greek yogurt",
    Taleggio: "5 oz Taleggio cheese, diced",
    Parmesan: "1/2 cup freshly grated Parmigiano-Reggiano",
    "Silken tofu": "1 block (14 oz) silken tofu, drained",
    // Starches & Grains
    "Yukon potatoes": "1 1/2 lb Yukon potatoes, cut into wedges",
    Potatoes: "2 lb Russet potatoes, peeled and mandoline-sliced",
    Fingerlings: "1 1/2 lb fingerling potatoes, halved",
    "Squid ink pasta": "1 lb fresh squid ink tagliolini",
    Polenta: "1 cup coarse yellow polenta",
    "Arborio rice": "1 1/2 cups Arborio rice",
    Rice: "2 cups jasmine rice, steamed",
    "Scallion pancake": "4 fresh scallion pancakes",
    "Puff pastry": "1 sheet puff pastry, cut into 4 rounds",
    Pita: "4 fresh pita rounds, warmed",
    // Aromatics & Seasonings
    Lemon: "3 lemons, zested and juiced",
    Oregano: "2 tablespoons chopped fresh oregano",
    Fennel: "1 small fennel bulb, shaved paper-thin",
    "Kalamata olives": "1/2 cup pitted Kalamata olives, chopped",
    Parsley: "1/3 cup finely chopped flat-leaf parsley",
    "Olive oil": "1/2 cup cold-pressed extra-virgin olive oil",
    "White wine": "3/4 cup dry white wine",
    "Calabrian chili": "1 to 2 tablespoons chopped Calabrian chili paste",
    "Preserved lemon": "2 tablespoons minced preserved lemon rind",
    Butter: "4 tablespoons unsalted butter",
    Sage: "16 fresh sage leaves",
    Marsala: "3/4 cup dry Marsala wine",
    Hazelnuts: "1/2 cup toasted hazelnuts, coarsely chopped",
    "Brown butter": "4 tablespoons prepared brown butter",
    "Vegetable stock": "5 cups hot vegetable or chicken stock",
    "Five spice": "1 1/2 teaspoons Chinese five-spice powder",
    "Shaoxing wine": "1/4 cup Shaoxing cooking wine",
    "Black vinegar": "3 tablespoons aged Chinkiang black vinegar",
    "Soy sauce": "3 tablespoons premium light soy sauce",
    "Chili crisp": "3 tablespoons house chili crisp",
    Ginger: "2 tablespoons fresh ginger, cut into matchsticks",
    Scallion: "4 scallions, thinly bias-sliced",
    Scallions: "4 scallions, thinly bias-sliced",
    Garlic: "4 cloves fresh garlic, finely minced",
    Shallot: "2 shallots, finely minced",
    "Bok choy": "4 baby bok choy heads, halved lengthwise",
    Broccolini: "1 bunch broccolini, trimmed",
    "Brussels sprouts": "1/2 lb Brussels sprouts, shaved thin",
    Corn: "3 ears sweet corn, kernels shucked (or 2 cups)",
    Bacon: "6 thick-cut bacon strips, diced",
    Honey: "3 tablespoons wildflower or thyme honey",
    Pistachios: "1/3 cup roasted unsalted pistachios, crushed",
    Dill: "3 tablespoons fresh dill sprigs",
    Capers: "2 tablespoons nonpareil capers, rinsed"
  };

  if (measures[ingredient]) return measures[ingredient];

  const ingLower = ingredient.toLowerCase();
  if (ingLower.includes("wine") || ingLower.includes("vinegar") || ingLower.includes("sauce") || ingLower.includes("oil") || ingLower.includes("honey") || ingLower.includes("butter")) {
    return `2 to 3 tablespoons ${ingLower}`;
  }
  if (ingLower.includes("spice") || ingLower.includes("pepper") || ingLower.includes("salt") || ingLower.includes("powder") || ingLower.includes("seed")) {
    return `1 to 2 teaspoons ${ingLower}`;
  }
  if (ingLower.includes("herb") || ingLower.includes("chive") || ingLower.includes("mint") || ingLower.includes("parsley") || ingLower.includes("dill")) {
    return `3 tablespoons chopped ${ingLower}`;
  }
  if (ingLower.includes("rice") || ingLower.includes("polenta") || ingLower.includes("pasta") || ingLower.includes("potato") || ingLower.includes("bean") || ingLower.includes("puree")) {
    return `2 cups prepared ${ingLower}`;
  }
  return `${index === 0 ? "4 portions" : "1 cup prepped"} ${ingLower}`;
}

function buildRecipe(special) {
  const mainIngredient = (special.ingredients && special.ingredients[0]) ? special.ingredients[0].toLowerCase() : "special item";
  return {
    yield: "4 portions",
    ingredients: [
      ...(special.ingredients || []).map(measuredIngredient),
      "Kosher salt and freshly cracked pepper",
      "Fresh herbs, crisp garnish, or finishing oil for service"
    ],
    steps: [
      "Review the station setup and portion the protein, garnish, sauce, and finishing elements before service.",
      `Prepare the supporting elements from the prep overview: ${special.overview}`,
      "Season the protein evenly. Sear, roast, grill, steam, or braise using the preparation style described in the overview.",
      "Warm the sauce or finishing element separately and adjust with salt, acid, and butter or olive oil for gloss.",
      "Bring the plate together to order: base first, protein second, sauce around or over the focal point, then fresh garnish.",
      "Taste one completed plate before selling the special and adjust acidity, salt, and portion size if needed."
    ],
    garnish: "Finish with fresh herbs, citrus zest, toasted nuts, crisp vegetables, or a glossy sauce that reinforces the cuisine style.",
    plating: `Use a warm wide-rim plate. Place the starch or vegetable base slightly off center, set the ${mainIngredient} as the focal point, spoon sauce with restraint, and finish with height from herbs or relish.`,
    imagePrompt: `A professional restaurant photograph of ${special.name.toLowerCase()}, elegant upscale plating on a white ceramic plate, visible main ingredients, refined garnish, soft natural side lighting, shallow depth of field, realistic dinner service presentation.`
  };
}

function buildMarketingKit(special) {
  const hashtags = [
    `#${(special.cuisine || "Chef").replace(/\s/g, "")}Cuisine`,
    "#DinnerSpecial",
    "#ChefSpecial",
    "#RestaurantLife",
    "#TonightOnly",
    "#FoodPhotography"
  ];

  const firstPairing = (special.pairing || "").split(",")[0] || "a curated beverage";

  return {
    instagram: `Tonight's ${special.cuisine} special: ${special.name}. ${special.caption} Limited portions for dinner service tonight.`,
    facebook: `Fresh from the kitchen tonight: ${special.name}. ${special.caption} Pair it with ${firstPairing} for a polished dinner pairing.`,
    menuBoard: `${special.name} — ${special.caption}`,
    chefNote: `Built for tonight's service: ${special.why}`,
    hashtags: hashtags.join(" "),
    postTime: "Best post window: 3:30-5:30 PM for dinner reservations, or 7:30 PM for same-night table interest."
  };
}

function imageStatusMarkup(special) {
  if (special.imageLoading) {
    return `<div class="image-status active">Generating a professional plated photo. This can take a moment...</div>`;
  }
  if (special.imageMessage) {
    return `<div class="image-status">${special.imageMessage}</div>`;
  }
  return `<div class="image-status">No photo has been generated yet. Click Generate Professional Photo to create the finished dish image.</div>`;
}

async function downloadImageFile(imageUrl, fileName) {
  if (!imageUrl) return;
  try {
    if (imageUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    // Fetch blob for cross-origin URLs to guarantee native download
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (err) {
    // If CORS prevents blob fetch, open in new tab as fallback
    window.open(imageUrl, "_blank");
  }
}

function renderCuisineChoices() {
  cuisineList.innerHTML = cuisines.map((cuisine) => `
    <button class="choice-btn ${cuisine === selectedCuisine ? "active" : ""}" type="button" data-cuisine="${cuisine}">
      <span>${cuisine}</span>
      <span aria-hidden="true">${cuisine === selectedCuisine ? "✓" : "›"}</span>
    </button>
  `).join("");
}

function generateSpecials() {
  const request = chefRequest.value.toLowerCase();
  const count = getRequestedCount(request);
  const usedNames = new Set();
  generationCounter += 1;

  currentSpecials = Array.from({ length: count }, () => {
    const special = buildGeneratedSpecial(selectedCuisine, request, usedNames);
    usedNames.add(special.name);
    return special;
  }).map((special, index) => ({
    ...special,
    id: `${selectedCuisine}-${Date.now()}-${generationCounter}-${index}`,
    cuisine: selectedCuisine,
    recipe: buildRecipe(special),
    marketing: buildMarketingKit({ ...special, cuisine: selectedCuisine })
  }));

  recentSpecialNames = [...currentSpecials.map((special) => special.name), ...recentSpecialNames].slice(0, 18);
  selectedSpecial = null;
  renderSpecials();
  renderRecipeEmpty();
}

function renderSpecials() {
  specialsHeading.textContent = `${selectedCuisine} ideas for tonight`;
  generationMeta.textContent = `${currentSpecials.length} special${currentSpecials.length === 1 ? "" : "s"}`;
  specialsList.innerHTML = currentSpecials.map((special) => `
    <article class="special-card">
      <div class="dish-art" aria-hidden="true"></div>
      <div class="special-content">
        <h4>${special.name}</h4>
        <p class="caption">${special.caption}</p>
        <div class="cost-grid">
          <div><span>Cuisine</span><strong>${special.cuisine}</strong></div>
          <div><span>Food cost</span><strong>${money(special.cost)}</strong></div>
          <div><span>Menu price</span><strong>${money(special.price)}</strong></div>
        </div>
        <p class="ingredient-line"><strong>Main ingredients:</strong> ${special.ingredients.join(", ")}</p>
        <p class="why-line"><strong>Why it works:</strong> ${special.why}</p>
        <div class="card-actions">
          <button class="card-action" type="button" data-recipe="${special.id}">View Full Recipe</button>
          <button class="card-action" type="button" data-image="${special.id}">Open Marketing Kit</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderRecipeEmpty() {
  recipePanel.innerHTML = `
    <div class="recipe-empty">
      <h3>Select a special to build the chef-ready recipe.</h3>
      <p>The full recipe will include yield, ingredients, preparation, plating, cost, price, pairing, and an image prompt.</p>
    </div>
  `;
}

function isSpecialSaved(special) {
  if (!special) return false;
  return getSaved().some((item) => item.name === special.name);
}

function renderRecipe(special) {
  selectedSpecial = special;
  special.marketing = special.marketing || buildMarketingKit(special);
  const alreadySaved = isSpecialSaved(special);

  recipePanel.innerHTML = `
    <div class="recipe-header">
      <div>
        <div class="section-title">Recipe Detail</div>
        <h3>${special.name}</h3>
        <p>${special.caption}</p>
      </div>
      <div class="recipe-actions">
        <button class="recipe-action" type="button" data-save="${special.id}">${alreadySaved ? "Saved ✓" : "Save Special"}</button>
        <button class="recipe-action" type="button" data-print>Print Recipe</button>
      </div>
    </div>
    <div class="marketing-kit">
      <div class="marketing-image-card">
        <div class="section-title">Marketing Kit</div>
        <div class="generated-image-frame">
          ${special.generatedImageUrl ? `<img src="${special.generatedImageUrl}" alt="Generated plated image for ${special.name}">` : `
            <div class="photo-empty-state">
              <div class="photo-frame-icon" aria-hidden="true">
                <span></span>
              </div>
              <strong>No generated photo yet</strong>
              <span>The finished food image will appear here after OpenAI image generation is connected and run.</span>
            </div>
          `}
        </div>
        ${imageStatusMarkup(special)}
        <div class="card-actions">
          <button class="card-action photo-action" type="button" data-generate-openai="${special.id}">Generate Professional Photo</button>
          ${special.generatedImageUrl ? `<button class="card-action link-action" type="button" data-download-image="${special.id}">Download Image</button>` : ""}
        </div>
      </div>
      <div class="marketing-copy-card">
        <div class="section-title">Social Copy</div>
        <h4>Ready-to-post caption</h4>
        <p class="social-caption">${special.marketing.instagram}</p>
        <p class="hashtag-line">${special.marketing.hashtags}</p>
        <div class="copy-grid">
          <div><span>Menu board</span><strong>${special.marketing.menuBoard}</strong></div>
          <div><span>Chef note</span><strong>${special.marketing.chefNote}</strong></div>
          <div><span>Post timing</span><strong>${special.marketing.postTime}</strong></div>
        </div>
        <div class="card-actions">
          <button class="card-action" type="button" data-copy-caption="${special.id}">Copy Instagram Caption</button>
          <button class="card-action" type="button" data-copy-facebook="${special.id}">Copy Facebook Caption</button>
        </div>
      </div>
    </div>
    <div class="recipe-body">
      <div class="recipe-block">
        <h4>Yield</h4>
        <p>${special.recipe.yield}</p>
      </div>
      <div class="recipe-block">
        <h4>Cost and Price</h4>
        <p>Estimated cost per portion: <strong>${money(special.cost)}</strong><br>Suggested selling price: <strong>${money(special.price)}</strong><br>Estimated profit margin: <strong>${margin(special.cost, special.price)}</strong></p>
      </div>
      <div class="recipe-block">
        <h4>Ingredients</h4>
        <ul>${special.recipe.ingredients.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="recipe-block">
        <h4>Preparation Steps</h4>
        <ol>${special.recipe.steps.map((item) => `<li>${item}</li>`).join("")}</ol>
      </div>
      <div class="recipe-block">
        <h4>Sauce or Garnish</h4>
        <p>${special.recipe.garnish}</p>
      </div>
      <div class="recipe-block">
        <h4>Plating Instructions</h4>
        <p>${special.recipe.plating}</p>
      </div>
      <div class="recipe-block">
        <h4>Wine or Drink Pairing</h4>
        <p>${special.pairing}</p>
      </div>
      <div class="recipe-block prompt-fallback">
        <h4>Prompt fallback</h4>
        <p>Use this prompt in ChatGPT, Midjourney, or DALL-E directly.</p>
        <details>
          <summary>Show image prompt</summary>
          <p class="image-prompt">${special.revisedPrompt || special.recipe.imagePrompt}</p>
        </details>
      </div>
    </div>
  `;
  recipePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showImagePrompt(special) {
  renderRecipe(special);
  const promptBlock = recipePanel.querySelector(".prompt-fallback");
  if (promptBlock) {
    const details = promptBlock.querySelector("details");
    if (details) details.open = true;
    promptBlock.style.borderColor = "var(--copper)";
    promptBlock.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

async function generateDishImage(special) {
  if (!special) return;
  special.imageLoading = true;
  special.imageMessage = "";
  renderRecipe(special);

  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dishName: special.name,
        cuisine: special.cuisine,
        caption: special.caption,
        ingredients: special.ingredients,
        plating: special.recipe.plating,
        prompt: special.recipe.imagePrompt,
        format: "square"
      })
    });
    const payload = await response.json().catch(() => ({
      error: "The image service returned an unreadable response."
    }));

    special.imageLoading = false;
    if (response.ok && payload.imageUrl) {
      special.generatedImageUrl = payload.imageUrl;
      special.revisedPrompt = payload.revisedPrompt;
      special.imageMessage = `Image generated with ${payload.model || "OpenAI"}. Ready for service.`;
    } else if (payload.setupNeeded) {
      special.imageMessage = payload.message;
    } else {
      special.imageMessage = payload.error
        ? `Image generation was not completed: ${payload.error}`
        : "Image generation was not completed.";
    }
  } catch (error) {
    special.imageLoading = false;
    special.imageMessage = error.message || "Image generation failed.";
  }

  renderRecipe(special);
}

function getSaved() {
  try {
    return JSON.parse(window.localStorage?.getItem("chef-specials-ai-saved") || "[]");
  } catch {
    return memorySavedSpecials;
  }
}

function setSaved(saved) {
  memorySavedSpecials = saved;
  try {
    // Strip oversized base64 images from localStorage to prevent QuotaExceededError
    const compactSaved = saved.map((item) => {
      if (item.generatedImageUrl && item.generatedImageUrl.startsWith("data:")) {
        const { generatedImageUrl, ...rest } = item;
        return { ...rest, hasGeneratedImage: true };
      }
      return item;
    });
    window.localStorage?.setItem("chef-specials-ai-saved", JSON.stringify(compactSaved));
  } catch (err) {
    console.warn("Storage quota exceeded or disabled; saved in memory for this session:", err);
  }
}

function saveSpecial(special) {
  const saved = getSaved();
  const record = {
    ...special,
    createdAt: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    savedByUser: true,
    fullRecipe: special.recipe
  };
  setSaved([record, ...saved.filter((item) => item.name !== special.name)].slice(0, 16));
  renderSaved();
}

function renderSaved() {
  const saved = getSaved();
  if (!saved.length) {
    savedList.className = "saved-list empty-state";
    savedList.textContent = "No saved specials yet.";
    return;
  }

  savedList.className = "saved-list";
  savedList.innerHTML = saved.map((item) => `
    <button class="saved-item" type="button" data-saved="${item.id}">
      <strong>${item.name}</strong>
      <span>${item.cuisine} · ${item.createdAt} · ${money(item.cost)} / ${money(item.price)}</span>
    </button>
  `).join("");
}

function bindEvents() {
  cuisineList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cuisine]");
    if (!button) return;
    selectedCuisine = button.dataset.cuisine;
    renderCuisineChoices();
    generateSpecials();
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      if (button.classList.contains("active")) {
        activeFilters.add(button.dataset.filter);
      } else {
        activeFilters.delete(button.dataset.filter);
      }
    });
  });

  document.querySelector("#generateBtn").addEventListener("click", generateSpecials);
  document.querySelector("#regenerateBtn").addEventListener("click", generateSpecials);
  document.querySelector("#createBtn").addEventListener("click", () => {
    document.querySelector("#generator").scrollIntoView({ behavior: "smooth", block: "start" });
    chefRequest.focus();
  });

  specialsList.addEventListener("click", (event) => {
    const recipeButton = event.target.closest("[data-recipe]");
    const imageButton = event.target.closest("[data-image]");
    if (recipeButton) {
      renderRecipe(currentSpecials.find((special) => special.id === recipeButton.dataset.recipe));
    }
    if (imageButton) {
      const special = currentSpecials.find((item) => item.id === imageButton.dataset.image);
      renderRecipe(special);
      recipePanel.querySelector(".marketing-kit")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  recipePanel.addEventListener("click", (event) => {
    const imageButton = event.target.closest("[data-generate-openai]");
    const downloadButton = event.target.closest("[data-download-image]");
    const copyInstagramButton = event.target.closest("[data-copy-caption]");
    const copyFacebookButton = event.target.closest("[data-copy-facebook]");
    const saveButton = event.target.closest("[data-save]");

    if (imageButton && selectedSpecial) {
      generateDishImage(selectedSpecial);
    }
    if (downloadButton && selectedSpecial?.generatedImageUrl) {
      const fileName = `${selectedSpecial.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      downloadImageFile(selectedSpecial.generatedImageUrl, fileName);
    }
    if (copyInstagramButton && selectedSpecial) {
      const text = `${selectedSpecial.marketing.instagram}\n\n${selectedSpecial.marketing.hashtags}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          copyInstagramButton.textContent = "Copied ✓";
          setTimeout(() => { copyInstagramButton.textContent = "Copy Instagram Caption"; }, 2000);
        }).catch(() => {
          window.prompt("Copy Instagram Caption:", text);
        });
      } else {
        window.prompt("Copy Instagram Caption:", text);
      }
    }
    if (copyFacebookButton && selectedSpecial) {
      const text = selectedSpecial.marketing.facebook;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          copyFacebookButton.textContent = "Copied ✓";
          setTimeout(() => { copyFacebookButton.textContent = "Copy Facebook Caption"; }, 2000);
        }).catch(() => {
          window.prompt("Copy Facebook Caption:", text);
        });
      } else {
        window.prompt("Copy Facebook Caption:", text);
      }
    }
    if (event.target.closest("[data-print]")) {
      window.print();
    }
    if (saveButton && selectedSpecial) {
      saveSpecial(selectedSpecial);
      saveButton.textContent = "Saved ✓";
    }
  });

  savedList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-saved]");
    if (!button) return;
    const special = getSaved().find((item) => item.id === button.dataset.saved);
    if (special) renderRecipe(special);
  });
}

renderCuisineChoices();
bindEvents();
generateSpecials();
renderSaved();
