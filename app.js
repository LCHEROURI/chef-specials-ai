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

let selectedCuisine = "Greek";
let activeFilters = new Set(["Seasonal"]);
let currentSpecials = [];
let selectedSpecial = null;
let memorySavedSpecials = [];

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

function measuredIngredient(ingredient, index) {
  const measures = {
    Branzino: "4 branzino fillets, 5 to 6 oz each",
    "Yukon potatoes": "1 1/2 lb Yukon potatoes, cut into wedges",
    Lemon: "3 lemons, zested and juiced",
    Oregano: "2 tablespoons chopped fresh oregano",
    Fennel: "1 small fennel bulb, shaved thin",
    "Kalamata olives": "1/2 cup pitted Kalamata olives, chopped",
    Parsley: "1/3 cup chopped parsley",
    "Olive oil": "1/2 cup extra-virgin olive oil",
    Lobster: "12 oz cooked lobster meat",
    "Squid ink pasta": "1 lb fresh squid ink tagliolini",
    "White wine": "3/4 cup dry white wine",
    "Calabrian chili": "1 tablespoon chopped Calabrian chili",
    "Preserved lemon": "2 tablespoons minced preserved lemon",
    Butter: "4 tablespoons unsalted butter",
    Veal: "1 lb veal scaloppine, pounded thin",
    Prosciutto: "4 thin slices prosciutto",
    Sage: "16 sage leaves",
    Marsala: "3/4 cup Marsala wine",
    Polenta: "1 cup polenta",
    Parmesan: "1/2 cup grated Parmesan",
    "Arborio rice": "1 1/2 cups Arborio rice",
    "Delicata squash": "1 1/2 lb delicata squash, roasted",
    Taleggio: "5 oz Taleggio, diced",
    Hazelnuts: "1/2 cup toasted hazelnuts",
    "Brown butter": "4 tablespoons brown butter",
    "Vegetable stock": "5 cups hot vegetable stock"
  };
  return measures[ingredient] || `${index === 0 ? "4 portions" : "1 prepared measure"} ${ingredient.toLowerCase()}`;
}

function buildRecipe(special) {
  const protein = special.ingredients[0].toLowerCase();
  return {
    yield: "4 portions",
    ingredients: [
      ...special.ingredients.map(measuredIngredient),
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
    plating: `Use a warm wide-rim plate. Place the starch or vegetable base slightly off center, set the ${special.ingredients[0].toLowerCase()} as the focal point, spoon sauce with restraint, and finish with height from herbs or relish.`,
    imagePrompt: `A professional restaurant photograph of ${special.name.toLowerCase()}, elegant upscale plating on a white ceramic plate, visible main ingredients, refined garnish, soft natural side lighting, shallow depth of field, realistic dinner service presentation.`
  };
}

function buildMarketingKit(special) {
  const hashtags = [
    `#${special.cuisine}Cuisine`.replace(/\s/g, ""),
    "#DinnerSpecial",
    "#ChefSpecial",
    "#RestaurantLife",
    "#TonightOnly",
    "#FoodPhotography"
  ];

  return {
    instagram: `Tonight's ${special.cuisine} special: ${special.name}. ${special.caption} Limited portions for dinner service tonight.`,
    facebook: `Fresh from the kitchen tonight: ${special.name}. ${special.caption} Pair it with ${special.pairing.split(",")[0]} for a polished dinner pairing.`,
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
  const count = request.includes("two") || request.includes("2") ? 2 : 3;
  let pool = [...sourceDishes[selectedCuisine]];

  if (activeFilters.has("Low food cost")) {
    pool.sort((a, b) => a.cost - b.cost);
  } else if (activeFilters.has("Premium special")) {
    pool.sort((a, b) => b.price - a.price);
  } else if (request.includes("seafood")) {
    pool.sort((a) => /branzino|halibut|scallop|cod|lobster|fish/i.test(a.name) ? -1 : 1);
  } else if (request.includes("vegetarian")) {
    pool.sort((a) => /carrot|mushroom|risotto/i.test(a.name) ? -1 : 1);
  } else {
    pool = pool.sort(() => Math.random() - 0.5);
  }

  currentSpecials = pool.slice(0, count).map((special, index) => ({
    ...special,
    id: `${selectedCuisine}-${Date.now()}-${index}`,
    cuisine: selectedCuisine,
    recipe: buildRecipe(special),
    marketing: buildMarketingKit({ ...special, cuisine: selectedCuisine })
  }));
  selectedSpecial = null;
  renderSpecials();
  renderRecipeEmpty();
}

function renderSpecials() {
  specialsHeading.textContent = `${selectedCuisine} ideas for tonight`;
  generationMeta.textContent = `${currentSpecials.length} specials`;
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

function renderRecipe(special) {
  selectedSpecial = special;
  special.marketing = special.marketing || buildMarketingKit(special);
  recipePanel.innerHTML = `
    <div class="recipe-header">
      <div>
        <div class="section-title">Recipe Detail</div>
        <h3>${special.name}</h3>
        <p>${special.caption}</p>
      </div>
      <div class="recipe-actions">
        <button class="recipe-action" type="button" data-save="${special.id}">Save Special</button>
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
          ${special.generatedImageUrl ? `<a class="card-action link-action" href="${special.generatedImageUrl}" download="${special.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png">Download Image</a>` : ""}
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
        <p>Use this only if the photo generator is not configured yet.</p>
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
  const prompt = recipePanel.querySelector(".image-prompt");
  prompt.closest(".recipe-block").style.borderColor = "var(--copper)";
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
      special.imageMessage = `Image generated with ${payload.model || "OpenAI"}. Ready for a square social post.`;
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
    window.localStorage?.setItem("chef-specials-ai-saved", JSON.stringify(saved));
  } catch {
    // Some locked-down browser contexts disable local storage; in-memory saves keep the session usable.
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
  setSaved([record, ...saved.filter((item) => item.name !== special.name)].slice(0, 12));
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
    const copyInstagramButton = event.target.closest("[data-copy-caption]");
    const copyFacebookButton = event.target.closest("[data-copy-facebook]");

    if (imageButton && selectedSpecial) {
      generateDishImage(selectedSpecial);
    }
    if (copyInstagramButton && selectedSpecial) {
      navigator.clipboard?.writeText(`${selectedSpecial.marketing.instagram}\n\n${selectedSpecial.marketing.hashtags}`);
      copyInstagramButton.textContent = "Copied";
    }
    if (copyFacebookButton && selectedSpecial) {
      navigator.clipboard?.writeText(selectedSpecial.marketing.facebook);
      copyFacebookButton.textContent = "Copied";
    }
    if (event.target.closest("[data-print]")) {
      window.print();
    }
    const saveButton = event.target.closest("[data-save]");
    if (saveButton && selectedSpecial) {
      saveSpecial(selectedSpecial);
      saveButton.textContent = "Saved";
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
