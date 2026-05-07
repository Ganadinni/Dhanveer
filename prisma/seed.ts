import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // ── Admin user ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("admin123", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@theteaplanet.com" },
    update: { role: "ADMIN", passwordHash: hash, name: "Admin" },
    create: { email: "admin@theteaplanet.com", name: "Admin", role: "ADMIN", passwordHash: hash },
  });
  console.log("Seeded admin:", admin.email, "role:", admin.role);

  // ── Product Knowledge Base ──────────────────────────────────────────────────
  const categories = [
    { name: "Beverage Premixes",      description: "Ready-to-use bubble tea, milk tea, fruit tea and coffee premix powders — 40+ flavours", sortOrder: 1 },
    { name: "Tea Concentrates",       description: "Premium liquid tea concentrates (Black, Green, Matcha, Mojito, Hojicha) — 30ml makes 150–200ml decoction", sortOrder: 2 },
    { name: "Syrups & Bases",         description: "Brown sugar, caramel, fruit syrups and flavour bases for beverages — 15+ varieties", sortOrder: 3 },
    { name: "Popping Boba",           description: "Fruit-juice filled popping pearls in 10+ flavours — mango, strawberry, lychee, passion fruit, blueberry and more", sortOrder: 4 },
    { name: "Tapioca Pearls",         description: "Classic and specialty tapioca pearls — black, mini, flavoured, ready-to-cook and instant", sortOrder: 5 },
    { name: "Milkshake & Lassi Mixes",description: "Instant milkshake and lassi premix powders — 12+ flavours including cookies & cream, mango, butterscotch", sortOrder: 6 },
    { name: "Mocktail & Lemonade Mixes", description: "Ready-to-mix mocktail and lemonade concentrates — 15+ trendy flavours for bars, cafes and events", sortOrder: 7 },
    { name: "Boba Desserts",          description: "Taro jar cakes, matcha Swiss rolls, dessert cups and boba-inspired sweets — 19+ products", sortOrder: 8 },
    { name: "Industrial Ingredients", description: "Bulk 20kg packs of Popping Boba, Konjac Pearls, Nata de Coco, Tapioca Pearls for large-scale operators", sortOrder: 9 },
  ];

  for (const cat of categories) {
    await db.productCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
  }

  const premixCat     = await db.productCategory.findUnique({ where: { name: "Beverage Premixes" } });
  const concCat       = await db.productCategory.findUnique({ where: { name: "Tea Concentrates" } });
  const syrupCat      = await db.productCategory.findUnique({ where: { name: "Syrups & Bases" } });
  const poppingCat    = await db.productCategory.findUnique({ where: { name: "Popping Boba" } });
  const tapiocaCat    = await db.productCategory.findUnique({ where: { name: "Tapioca Pearls" } });
  const milkshakeCat  = await db.productCategory.findUnique({ where: { name: "Milkshake & Lassi Mixes" } });
  const mocktailCat   = await db.productCategory.findUnique({ where: { name: "Mocktail & Lemonade Mixes" } });
  const dessertCat    = await db.productCategory.findUnique({ where: { name: "Boba Desserts" } });
  const industrialCat = await db.productCategory.findUnique({ where: { name: "Industrial Ingredients" } });

  const products = [

    // ════════════════════════════════════════════════════════════════════════════
    // BEVERAGE PREMIXES — 40+ flavours covering milk tea, fruit tea, coffee, chai
    // ════════════════════════════════════════════════════════════════════════════

    // ── Bubble Tea / Boba Premixes ─────────────────────────────────────────────
    { sku: "BP-TARO-500", name: "Taro Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Classic taro-flavoured bubble tea premix. Just add water — no blender needed. 20 servings per 500g.",
      targetCustomers: "cafes, bubble tea shops, QSR chains, food courts, hotels, cloud kitchens, college canteens",
      usages: "Hot/iced bubble tea, milky taro drinks, smoothie base, café menu extension",
      keyBenefits: "No special equipment needed, consistent taste every batch, 200%+ gross margin per cup, long shelf life",
      hsnCode: "2101", gstRate: 18, mrp: 450, dealerPrice: 320, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 1 },

    { sku: "BP-MANGO-500", name: "Mango Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Tropical mango flavoured boba premix — bestseller for summer menus. Natural mango flavour, no artificial colours.",
      targetCustomers: "cafes, bubble tea shops, QSR chains, hotels, resorts, juice bars, cloud kitchens",
      usages: "Bubble tea, iced mango tea, mango slushie base, party drinks, fruit tea",
      keyBenefits: "Natural mango flavour, no artificial colours, fast 2-min prep, top-selling SKU across all regions",
      hsnCode: "2101", gstRate: 18, mrp: 450, dealerPrice: 320, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 2 },

    { sku: "BP-MATCHA-500", name: "Matcha Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Japanese-style matcha green tea bubble tea premix. Premium health positioning for upscale menus.",
      targetCustomers: "specialty cafes, health cafes, yoga studios, wellness centres, premium hotels, beverage startups",
      usages: "Hot/cold matcha latte, matcha boba, matcha smoothie, matcha frappe",
      keyBenefits: "Authentic matcha flavour, health & wellness positioning, premium price point, top trending SKU 2024-25",
      hsnCode: "2101", gstRate: 18, mrp: 520, dealerPrice: 370, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 3 },

    { sku: "BP-STRAWBERRY-500", name: "Strawberry Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Sweet strawberry boba premix with appealing pink colour. Popular with young audiences and dessert cafes.",
      targetCustomers: "dessert cafes, bakeries, ice cream parlours, bubble tea shops, college canteens, events",
      usages: "Boba drinks, strawberry iced tea, dessert drinks, smoothie base, event beverages",
      keyBenefits: "Eye-catching pink colour, popular with Gen Z, consistent colour every serve, easy cross-sell with desserts",
      hsnCode: "2101", gstRate: 18, mrp: 450, dealerPrice: 320, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 4 },

    { sku: "BP-CHOCOLATE-500", name: "Chocolate Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Rich chocolate boba premix — combines chocolate shake experience with bubble tea. Works hot and cold.",
      targetCustomers: "cafes, dessert parlours, QSR chains, college canteens, multiplexes, cloud kitchens",
      usages: "Chocolate boba, hot chocolate boba, choco shake, dessert drink, mocha tea",
      keyBenefits: "Universal appeal across all ages, works hot and cold, high repeat purchase rate",
      hsnCode: "2101", gstRate: 18, mrp: 480, dealerPrice: 340, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 5 },

    { sku: "BP-BLUEBERRY-500", name: "Blueberry Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Rich blueberry flavoured bubble tea premix with deep purple colour — highly Instagrammable.",
      targetCustomers: "specialty cafes, dessert cafes, bubble tea shops, premium hotels, college canteens",
      usages: "Blueberry boba, iced blueberry tea, blueberry smoothie, purple drinks menu",
      keyBenefits: "Striking purple colour drives social media sharing, antioxidant health angle, premium positioning",
      hsnCode: "2101", gstRate: 18, mrp: 480, dealerPrice: 340, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 6 },

    { sku: "BP-LYCHEE-500", name: "Lychee Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Delicate floral lychee milk tea premix — refreshing and premium. Pairs beautifully with popping boba.",
      targetCustomers: "premium cafes, bubble tea shops, Asian restaurants, hotels, QSR chains",
      usages: "Lychee milk tea, lychee iced tea, lychee boba, fruit tea bases",
      keyBenefits: "Premium floral taste, pairs perfectly with lychee popping boba, high-ticket menu item potential",
      hsnCode: "2101", gstRate: 18, mrp: 460, dealerPrice: 330, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 7 },

    { sku: "BP-HONEYDEW-500", name: "Honeydew Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Light green honeydew melon milk tea premix — refreshing summer flavour with beautiful pastel colour.",
      targetCustomers: "cafes, bubble tea shops, QSR chains, resorts, food courts",
      usages: "Honeydew milk tea, iced honeydew drink, summer menu feature, light dessert drink",
      keyBenefits: "Unique pastel green colour for visual appeal, refreshing summer positioning, complements dessert menus",
      hsnCode: "2101", gstRate: 18, mrp: 460, dealerPrice: 330, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 8 },

    { sku: "BP-BROWN-SUGAR-MT-500", name: "Brown Sugar Milk Tea Premix", categoryId: premixCat!.id,
      description: "Taiwanese-inspired brown sugar milk tea premix — the iconic tiger milk tea experience in a premix format.",
      targetCustomers: "bubble tea shops, cafes, QSR chains, cloud kitchens, Taiwanese/Asian restaurants",
      usages: "Tiger milk tea, brown sugar boba, layered milk tea, TikTok-trending drinks",
      keyBenefits: "Recreates the trending tiger milk tea, rich caramel-molasses depth, highly shareable visual",
      hsnCode: "2101", gstRate: 18, mrp: 490, dealerPrice: 350, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 9 },

    { sku: "BP-THAI-ORANGE-500", name: "Thai Orange Tea Premix", categoryId: premixCat!.id,
      description: "Authentic Thai-style orange milk tea premix — the iconic street drink of Southeast Asia.",
      targetCustomers: "Thai restaurants, Asian fusion cafes, bubble tea shops, QSR chains, food courts",
      usages: "Thai iced tea, hot Thai milk tea, layered bubble tea, Asian-fusion menus",
      keyBenefits: "Iconic orange colour for visual appeal, trending South-East Asian flavour, premium menu positioning",
      hsnCode: "2101", gstRate: 18, mrp: 460, dealerPrice: 330, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 10 },

    { sku: "BP-WINTERMELON-500", name: "Wintermelon Milk Tea Premix", categoryId: premixCat!.id,
      description: "Classic Taiwanese wintermelon milk tea premix with signature light caramel sweetness.",
      targetCustomers: "bubble tea shops, specialty cafes, Asian restaurants, premium hotels, QSR chains",
      usages: "Wintermelon milk tea, wintermelon iced tea, speciality boba drinks, PAN Asian menu",
      keyBenefits: "Authentic Taiwanese staple flavour, subtle sweetness appeals to health-conscious customers, unique differentiation",
      hsnCode: "2101", gstRate: 18, mrp: 470, dealerPrice: 335, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 11 },

    { sku: "BP-GREEN-APPLE-500", name: "Green Apple Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Tangy green apple bubble tea premix — bright green colour with refreshing tartness.",
      targetCustomers: "cafes, bubble tea shops, college canteens, multiplexes, QSR chains",
      usages: "Green apple boba, apple iced tea, green apple slushie, refreshing summer drinks",
      keyBenefits: "Striking green colour, refreshing tartness appeals to younger customers, high Instagram potential",
      hsnCode: "2101", gstRate: 18, mrp: 450, dealerPrice: 320, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 12 },

    { sku: "BP-PEACH-500", name: "Peach Oolong Bubble Tea Premix", categoryId: premixCat!.id,
      description: "Fruity peach oolong tea premix — the bestselling fruit tea flavour in South-East Asian bubble tea chains.",
      targetCustomers: "cafes, bubble tea shops, QSR chains, premium hotels, fruit tea concept stores",
      usages: "Peach oolong tea, peach iced tea, fruit tea menu, premium café offerings",
      keyBenefits: "Globally trending fruit tea flavour, pairs beautifully with popping boba, premium café positioning",
      hsnCode: "2101", gstRate: 18, mrp: 480, dealerPrice: 340, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 13 },

    { sku: "BP-ROSE-500", name: "Rose Milk Tea Premix", categoryId: premixCat!.id,
      description: "Fragrant rose-flavoured milk tea premix — pink colour, floral aroma, premium gifting appeal.",
      targetCustomers: "premium cafes, wedding caterers, dessert cafes, sweet shops, gifting brands",
      usages: "Rose milk tea, rose latte, festive/wedding drinks, Valentine's Day menu, gifting hampers",
      keyBenefits: "Elegant pink colour perfect for events, high gifting demand, premium pricing potential, festive bestseller",
      hsnCode: "2101", gstRate: 18, mrp: 490, dealerPrice: 350, moq: "1 pouch (500g)", packSize: "500g (approx. 20 servings)", shelfLife: "12 months", sortOrder: 14 },

    // ── Instant Tea / Chai Premixes ────────────────────────────────────────────
    { sku: "BP-MASALA-CHAI-1KG", name: "Masala Chai Premix", categoryId: premixCat!.id,
      description: "Traditional Indian masala chai premix with real spices — cardamom, ginger, cinnamon. Ideal for vending and institutional use.",
      targetCustomers: "office canteens, hotels, dhabas, airports, hospital cafeterias, corporate offices, railways",
      usages: "Vending machines, bulk institutional chai, takeaway stalls, hospitality, corporate pantries",
      keyBenefits: "Authentic taste with real spices, consistent quality, no brewing required, FSSAI certified, highest volume SKU",
      hsnCode: "2101", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 kg pouch", packSize: "1 kg (approx. 100 cups)", shelfLife: "18 months", sortOrder: 15 },

    { sku: "BP-GINGER-CHAI-1KG", name: "Ginger Tea Premix", categoryId: premixCat!.id,
      description: "Zingy ginger tea premix — soothing and spicy. Very popular during monsoon and winter seasons.",
      targetCustomers: "offices, hospitals, hotels, airlines, railways, canteens, wellness cafes",
      usages: "Hot beverage service, vending, wellness menus, airline/railway catering, monsoon specials",
      keyBenefits: "High seasonal demand (monsoon/winter), wellness & immunity positioning, authentic ginger heat",
      hsnCode: "2101", gstRate: 18, mrp: 360, dealerPrice: 250, moq: "1 kg pouch", packSize: "1 kg (approx. 100 cups)", shelfLife: "18 months", sortOrder: 16 },

    { sku: "BP-ELAICHI-CHAI-1KG", name: "Elaichi (Cardamom) Tea Premix", categoryId: premixCat!.id,
      description: "Fragrant cardamom tea — premium chai experience in seconds. Luxury positioning for hotels and gifting.",
      targetCustomers: "premium hotels, corporate offices, cafes, households, gifting brands, airlines",
      usages: "Hospitality chai service, corporate gifting, premium vending, hotel in-room service",
      keyBenefits: "Luxury fragrance positioning, gifting SKU potential, distinct aroma = brand recall, premium pricing",
      hsnCode: "2101", gstRate: 18, mrp: 400, dealerPrice: 280, moq: "1 kg pouch", packSize: "1 kg (approx. 100 cups)", shelfLife: "18 months", sortOrder: 17 },

    { sku: "BP-LEMON-TEA-1KG", name: "Lemon Iced Tea Premix", categoryId: premixCat!.id,
      description: "Refreshing lemon iced tea premix — tangy, light and perfect for summer menus.",
      targetCustomers: "restaurants, cafes, QSR chains, hotels, food courts, college canteens, events",
      usages: "Iced lemon tea, lemon sparkling tea, summer menu, mocktail base, takeaway cups",
      keyBenefits: "Summer bestseller, refreshing citrus appeal, pairs with any meal, high velocity in warm months",
      hsnCode: "2101", gstRate: 18, mrp: 340, dealerPrice: 230, moq: "1 kg pouch", packSize: "1 kg (approx. 100 cups)", shelfLife: "18 months", sortOrder: 18 },

    { sku: "BP-PEACH-ICED-TEA-1KG", name: "Peach Iced Tea Premix", categoryId: premixCat!.id,
      description: "Sweet peach iced tea premix — globally popular flavour loved by all age groups.",
      targetCustomers: "restaurants, cafes, QSR chains, hotels, multiplexes, food courts, corporate cafeterias",
      usages: "Peach iced tea, peach fruit punch, summer menu feature, mocktail mixing",
      keyBenefits: "Global mass-appeal flavour, premium to regular customers ratio is high, consistent year-round demand",
      hsnCode: "2101", gstRate: 18, mrp: 350, dealerPrice: 240, moq: "1 kg pouch", packSize: "1 kg (approx. 100 cups)", shelfLife: "18 months", sortOrder: 19 },

    // ── Coffee Premixes ────────────────────────────────────────────────────────
    { sku: "BP-CAPPUCCINO-1KG", name: "Cappuccino Premix", categoryId: premixCat!.id,
      description: "Rich and frothy cappuccino premix — barista-quality coffee in seconds. No espresso machine needed.",
      targetCustomers: "offices, hotels, cafes, vending operators, co-working spaces, IT parks, corporate offices",
      usages: "Hot cappuccino, iced cappuccino, frothy drinks, vending machines, office pantries",
      keyBenefits: "Consistent barista taste without equipment, great vending ROI, FSSAI approved",
      hsnCode: "2101", gstRate: 18, mrp: 560, dealerPrice: 390, moq: "1 kg pouch", packSize: "1 kg (approx. 80 cups)", shelfLife: "18 months", sortOrder: 20 },

    { sku: "BP-MOCHA-1KG", name: "Mocha Coffee Premix", categoryId: premixCat!.id,
      description: "Chocolate-coffee blend — one of the most popular café drinks among millennials and Gen Z.",
      targetCustomers: "cafes, restaurants, co-working spaces, colleges, multiplexes, cloud kitchens",
      usages: "Hot/iced mocha, mocha shake, dessert drink, mocha boba",
      keyBenefits: "Cross-sells with chocolate desserts, millennial favourite, premium positioning, high repeat orders",
      hsnCode: "2101", gstRate: 18, mrp: 580, dealerPrice: 410, moq: "1 kg pouch", packSize: "1 kg (approx. 80 cups)", shelfLife: "18 months", sortOrder: 21 },

    { sku: "BP-HAZELNUT-COFFEE-1KG", name: "Hazelnut Coffee Premix", categoryId: premixCat!.id,
      description: "Premium hazelnut flavoured coffee premix — café-style indulgence without the barista.",
      targetCustomers: "premium cafes, hotels, co-working spaces, corporate offices, gifting brands",
      usages: "Hazelnut latte, iced hazelnut coffee, premium vending, office pantry upgrade",
      keyBenefits: "Premium European-style flavour, high perceived value = better pricing power, aspirational positioning",
      hsnCode: "2101", gstRate: 18, mrp: 620, dealerPrice: 440, moq: "1 kg pouch", packSize: "1 kg (approx. 80 cups)", shelfLife: "18 months", sortOrder: 22 },

    { sku: "BP-COLD-COFFEE-1KG", name: "Cold Coffee Premix", categoryId: premixCat!.id,
      description: "Creamy cold coffee premix — the most ordered coffee variant in India during summer.",
      targetCustomers: "cafes, QSR chains, juice bars, cloud kitchens, college canteens, food courts",
      usages: "Cold coffee, coffee shake, iced coffee drinks, summer menu, delivery menu",
      keyBenefits: "India's favourite summer coffee drink, high order frequency, delivery-friendly, consistent texture",
      hsnCode: "2101", gstRate: 18, mrp: 520, dealerPrice: 370, moq: "1 kg pouch", packSize: "1 kg (approx. 80 cups)", shelfLife: "18 months", sortOrder: 23 },

    // ════════════════════════════════════════════════════════════════════════════
    // TEA CONCENTRATES
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "TC-BLACK-1L", name: "Black Tea Concentrate", categoryId: concCat!.id,
      description: "Premium black tea liquid concentrate. 30ml makes 150–200ml full-strength decoction. Direct sourced from Assam and West Bengal.",
      targetCustomers: "cafes, bubble tea shops, restaurants, hotels, QSR chains, cloud kitchens, caterers",
      usages: "Bubble tea base, iced tea, hot tea decoction, milk tea, chai base, masala tea",
      keyBenefits: "Direct farm sourcing from Assam & West Bengal, 1 bottle replaces 100+ tea bags, HALAL certified",
      hsnCode: "2101", gstRate: 18, mrp: 350, dealerPrice: 240, moq: "1 bottle (1L)", packSize: "1L bottle (33+ servings)", shelfLife: "18 months", sortOrder: 1 },

    { sku: "TC-GREEN-1L", name: "Green Tea Concentrate", categoryId: concCat!.id,
      description: "Light and refreshing green tea concentrate — sourced from Darjeeling and Tamil Nadu. Delicate floral notes.",
      targetCustomers: "health cafes, wellness centres, premium hotels, yoga studios, specialty cafes",
      usages: "Green tea iced tea, fruit green tea, green tea boba base, wellness menu, detox drinks",
      keyBenefits: "Darjeeling sourced quality, health & antioxidant positioning, pairs with fruit syrups beautifully",
      hsnCode: "0902", gstRate: 5, mrp: 360, dealerPrice: 250, moq: "1 bottle (1L)", packSize: "1L bottle (33+ servings)", shelfLife: "18 months", sortOrder: 2 },

    { sku: "TC-MATCHA-500ML", name: "Matcha Green Tea Concentrate", categoryId: concCat!.id,
      description: "Premium matcha concentrate from Japan-grade tea farms. Rich umami flavour for premium beverage applications.",
      targetCustomers: "specialty cafes, health cafes, premium hotels, wellness centres, beverage startups",
      usages: "Matcha latte, matcha boba, matcha smoothie, matcha frappe, dessert applications",
      keyBenefits: "Japan-grade matcha quality, health positioning, trending product, premium pricing potential",
      hsnCode: "0902", gstRate: 5, mrp: 480, dealerPrice: 340, moq: "1 bottle (500ml)", packSize: "500ml bottle", shelfLife: "12 months", sortOrder: 3 },

    { sku: "TC-HOJICHA-500ML", name: "Hojicha (Roasted Green Tea) Concentrate", categoryId: concCat!.id,
      description: "Japanese roasted green tea concentrate — nutty, earthy, low caffeine. Growing in premium café menus.",
      targetCustomers: "specialty cafes, Japanese restaurants, PAN Asian restaurants, premium hotels, tea enthusiasts",
      usages: "Hojicha latte, hojicha boba, evening tea menu, low-caffeine option, dessert pairings",
      keyBenefits: "Premium niche positioning, low caffeine appeals to evening drinkers, unique differentiation for café menus",
      hsnCode: "0902", gstRate: 5, mrp: 520, dealerPrice: 370, moq: "1 bottle (500ml)", packSize: "500ml bottle", shelfLife: "12 months", sortOrder: 4 },

    { sku: "TC-MOJITO-TEA-500ML", name: "Mojito Tea Concentrate", categoryId: concCat!.id,
      description: "Mint-lime flavoured tea concentrate — fresh, zingy base for mocktails and iced teas.",
      targetCustomers: "restaurants, bars, cafes, event caterers, hotels, resorts, cloud kitchens",
      usages: "Mojito iced tea, mint lemon tea, mocktail base, summer menu staple, party drinks",
      keyBenefits: "Dual-use as tea and mocktail base, saves prep time, consistent mint-lime balance every time",
      hsnCode: "2101", gstRate: 18, mrp: 400, dealerPrice: 280, moq: "1 bottle (500ml)", packSize: "500ml bottle", shelfLife: "12 months", sortOrder: 5 },

    // ════════════════════════════════════════════════════════════════════════════
    // SYRUPS & BASES
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "SB-BROWN-SUGAR-750ML", name: "Brown Sugar Syrup", categoryId: syrupCat!.id,
      description: "Authentic Taiwanese brown sugar syrup for tiger milk tea and brown sugar boba. Deep caramel-molasses flavour.",
      targetCustomers: "bubble tea shops, cafes, QSR chains, dessert parlours, cloud kitchens",
      usages: "Tiger milk tea, brown sugar boba, pancake drizzle, dessert topping, iced drinks",
      keyBenefits: "Authentic Taiwanese flavour, dramatic tiger-stripe visual for Instagram content, consistent results",
      hsnCode: "1702", gstRate: 18, mrp: 280, dealerPrice: 190, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 1 },

    { sku: "SB-CARAMEL-750ML", name: "Caramel Syrup", categoryId: syrupCat!.id,
      description: "Rich buttery caramel syrup — essential for coffees, milkshakes and dessert drinks.",
      targetCustomers: "cafes, coffee shops, dessert parlours, hotels, restaurants, cloud kitchens",
      usages: "Caramel latte, caramel frappe, caramel milkshake, dessert drizzle, caramel boba",
      keyBenefits: "Universal flavour across all beverage types, premium dessert drizzle, adds indulgence factor",
      hsnCode: "2106", gstRate: 18, mrp: 260, dealerPrice: 175, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 2 },

    { sku: "SB-VANILLA-750ML", name: "Vanilla Syrup", categoryId: syrupCat!.id,
      description: "Classic vanilla syrup — the most-used flavouring syrup across cafes, coffee shops and bakers.",
      targetCustomers: "cafes, coffee shops, bakeries, hotels, restaurants, ice cream parlours",
      usages: "Vanilla latte, vanilla milkshake, vanilla boba, cake flavouring, coffee sweetener",
      keyBenefits: "Most versatile syrup — works in 20+ applications, classic taste every customer recognises",
      hsnCode: "2106", gstRate: 18, mrp: 250, dealerPrice: 170, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 3 },

    { sku: "SB-LYCHEE-750ML", name: "Lychee Syrup", categoryId: syrupCat!.id,
      description: "Premium lychee flavour syrup — versatile base for mocktails, bubble tea and fruit drinks.",
      targetCustomers: "bars, cafes, restaurants, hotels, bubble tea shops, event caterers",
      usages: "Mocktails, lychee iced tea, bubble tea flavouring, lemonade mixer, dessert topping",
      keyBenefits: "Versatile across 5+ drink types, premium floral taste, low cost per serve",
      hsnCode: "2106", gstRate: 18, mrp: 320, dealerPrice: 220, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "24 months", sortOrder: 4 },

    { sku: "SB-PASSION-750ML", name: "Passion Fruit Syrup", categoryId: syrupCat!.id,
      description: "Tangy passion fruit syrup — trending tropical flavour with vibrant yellow colour.",
      targetCustomers: "cafes, bars, restaurants, beach resorts, juice bars, event caterers, cloud kitchens",
      usages: "Mocktails, passion fruit iced tea, tropical drinks, cocktail mixers, fruit bubble tea",
      keyBenefits: "Trending tropical flavour, Instagram-worthy yellow colour, high-margin drinks",
      hsnCode: "2106", gstRate: 18, mrp: 340, dealerPrice: 230, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "24 months", sortOrder: 5 },

    { sku: "SB-STRAWBERRY-SYR-750ML", name: "Strawberry Syrup", categoryId: syrupCat!.id,
      description: "Vibrant strawberry syrup — sweet, red and versatile across drinks and desserts.",
      targetCustomers: "cafes, ice cream parlours, dessert stores, bakeries, bubble tea shops, QSR chains",
      usages: "Strawberry milkshake, strawberry lemonade, boba flavouring, ice cream topping, cake drizzle",
      keyBenefits: "Universal kid and adult appeal, beautiful red colour, works hot and cold",
      hsnCode: "2106", gstRate: 18, mrp: 290, dealerPrice: 195, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "24 months", sortOrder: 6 },

    { sku: "SB-MANGO-SYR-750ML", name: "Mango Syrup", categoryId: syrupCat!.id,
      description: "Sweet Alphonso mango syrup — India's favourite fruit flavour in syrup form.",
      targetCustomers: "juice bars, cafes, restaurants, hotels, sweet shops, cloud kitchens, caterers",
      usages: "Mango lassi base, mango milkshake, mango mocktail, mango boba, aamras drinks",
      keyBenefits: "Alphonso mango quality positioning, India's #1 fruit flavour, high seasonal demand (Apr-Jun)",
      hsnCode: "2106", gstRate: 18, mrp: 300, dealerPrice: 205, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "24 months", sortOrder: 7 },

    { sku: "SB-ROSE-SYR-750ML", name: "Rose Syrup", categoryId: syrupCat!.id,
      description: "Fragrant rose syrup — the essential ingredient for rose milk, rooh afza drinks and festive menus.",
      targetCustomers: "sweet shops, mithai parlours, restaurants, hotels, caterers, wedding venues",
      usages: "Rose milk, rose lemonade, rose boba, faluda, festive drinks, wedding menus",
      keyBenefits: "High demand during Eid, Ramadan and wedding season, premium rose fragrance, festive staple",
      hsnCode: "2106", gstRate: 18, mrp: 270, dealerPrice: 180, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "24 months", sortOrder: 8 },

    { sku: "SB-HAZELNUT-SYR-750ML", name: "Hazelnut Syrup", categoryId: syrupCat!.id,
      description: "Premium European-style hazelnut syrup — the go-to for hazelnut lattes and premium coffee drinks.",
      targetCustomers: "premium cafes, coffee shops, hotels, co-working spaces, corporate pantries",
      usages: "Hazelnut latte, hazelnut frappe, hazelnut mocha, premium coffee drinks",
      keyBenefits: "European café positioning, high perceived premium value, pairs with all coffee types",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 9 },

    { sku: "SB-GREEN-APPLE-SYR-750ML", name: "Green Apple Syrup", categoryId: syrupCat!.id,
      description: "Crisp green apple syrup — tart and refreshing, ideal for mocktails and fruit teas.",
      targetCustomers: "bars, cafes, QSR chains, restaurants, mocktail bars, event caterers",
      usages: "Green apple mocktail, apple iced tea, apple lemonade, cocktail mixer",
      keyBenefits: "Unique tart profile differentiates menu, bright green colour for visual appeal",
      hsnCode: "2106", gstRate: 18, mrp: 310, dealerPrice: 210, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "24 months", sortOrder: 10 },

    // ════════════════════════════════════════════════════════════════════════════
    // POPPING BOBA
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "PB-MANGO-450G", name: "Mango Popping Boba", categoryId: poppingCat!.id,
      description: "Mango juice-filled popping pearls that burst in the mouth. The #1 topping for bubble tea and desserts.",
      targetCustomers: "bubble tea shops, cafes, dessert parlours, QSR chains, hotels, ice cream shops",
      usages: "Bubble tea topping, yogurt topping, dessert cup, ice cream sundae, pancake topping",
      keyBenefits: "Burst-on-bite experience drives repeat orders, vibrant colour, ready to use — no cooking",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 jar (450g)", packSize: "450g jar (approx. 30 servings)", shelfLife: "12 months", sortOrder: 1 },

    { sku: "PB-STRAWBERRY-450G", name: "Strawberry Popping Boba", categoryId: poppingCat!.id,
      description: "Strawberry juice-filled popping pearls with vivid red colour — top-selling popping boba.",
      targetCustomers: "bubble tea shops, dessert cafes, ice cream shops, QSR chains, birthday venues",
      usages: "Bubble tea, dessert topping, frozen yogurt, smoothie bowl, cake decoration",
      keyBenefits: "Vivid red colour, popular with children and Gen Z, ready to use — no cooking",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 jar (450g)", packSize: "450g jar", shelfLife: "12 months", sortOrder: 2 },

    { sku: "PB-LYCHEE-450G", name: "Lychee Popping Boba", categoryId: poppingCat!.id,
      description: "Delicate lychee juice-filled pearls — floral, light, refreshing. Pairs perfectly with green and white teas.",
      targetCustomers: "premium cafes, bubble tea shops, hotels, wellness cafes, Asian restaurants",
      usages: "Premium bubble tea, mocktail garnish, dessert cup, yogurt bowl, fruit salad",
      keyBenefits: "Premium floral flavour, pairs with 10+ tea bases, unique menu differentiation",
      hsnCode: "2106", gstRate: 18, mrp: 400, dealerPrice: 275, moq: "1 jar (450g)", packSize: "450g jar", shelfLife: "12 months", sortOrder: 3 },

    { sku: "PB-PASSION-FRUIT-450G", name: "Passion Fruit Popping Boba", categoryId: poppingCat!.id,
      description: "Tangy passion fruit popping pearls — trending tropical burst experience.",
      targetCustomers: "cafes, bubble tea shops, beach resorts, tropical-themed bars, QSR chains",
      usages: "Passion fruit boba, tropical bubble tea, mocktail garnish, dessert topping",
      keyBenefits: "Trending tropical taste, Instagram-worthy on desserts and drinks, distinctive yellow colour",
      hsnCode: "2106", gstRate: 18, mrp: 400, dealerPrice: 275, moq: "1 jar (450g)", packSize: "450g jar", shelfLife: "12 months", sortOrder: 4 },

    { sku: "PB-BLUEBERRY-450G", name: "Blueberry Popping Boba", categoryId: poppingCat!.id,
      description: "Rich blueberry popping pearls with deep purple hue — antioxidant health angle + visual appeal.",
      targetCustomers: "health cafes, premium bubble tea shops, wellness centres, dessert parlours",
      usages: "Health-positioned bubble tea, purple drinks, smoothie bowl topping, yogurt parfait",
      keyBenefits: "Antioxidant health positioning, striking purple colour, premium health café alignment",
      hsnCode: "2106", gstRate: 18, mrp: 410, dealerPrice: 285, moq: "1 jar (450g)", packSize: "450g jar", shelfLife: "12 months", sortOrder: 5 },

    { sku: "PB-ORANGE-450G", name: "Orange Popping Boba", categoryId: poppingCat!.id,
      description: "Citrusy orange popping pearls — tangy, bright and refreshing.",
      targetCustomers: "cafes, QSR chains, juice bars, food courts, hotels",
      usages: "Orange bubble tea, citrus mocktail garnish, fruit punch topping, dessert decoration",
      keyBenefits: "Vibrant orange colour for visual impact, citrus tanginess balances sweet drinks",
      hsnCode: "2106", gstRate: 18, mrp: 370, dealerPrice: 255, moq: "1 jar (450g)", packSize: "450g jar", shelfLife: "12 months", sortOrder: 6 },

    { sku: "PB-GREEN-APPLE-450G", name: "Green Apple Popping Boba", categoryId: poppingCat!.id,
      description: "Tart green apple popping pearls — unique flavour that stands out in any menu.",
      targetCustomers: "specialty cafes, QSR chains, college canteens, food courts",
      usages: "Apple bubble tea, tart drink topping, dessert garnish, smoothie bowl",
      keyBenefits: "Unique tart flavour differentiation, appeals to customers wanting something different",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 jar (450g)", packSize: "450g jar", shelfLife: "12 months", sortOrder: 7 },

    // ════════════════════════════════════════════════════════════════════════════
    // TAPIOCA PEARLS
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "TP-BLACK-1KG", name: "Classic Black Tapioca Pearls", categoryId: tapiocaCat!.id,
      description: "Traditional black tapioca boba pearls. Cook in 30 minutes, serve for up to 4 hours.",
      targetCustomers: "bubble tea shops, cafes, QSR chains, restaurants, cloud kitchens, caterers",
      usages: "Classic bubble tea, milk tea, dessert cups, taro pudding, tapioca drinks",
      keyBenefits: "The foundational boba ingredient, 1 kg = 80–100 servings, consistent chewy texture",
      hsnCode: "1903", gstRate: 18, mrp: 320, dealerPrice: 210, moq: "1 kg pouch", packSize: "1 kg (80–100 servings)", shelfLife: "24 months", sortOrder: 1 },

    { sku: "TP-INSTANT-1KG", name: "Instant Tapioca Pearls (5-Min Cook)", categoryId: tapiocaCat!.id,
      description: "Quick-cook tapioca pearls ready in just 5 minutes — perfect for high-volume and fast-service operations.",
      targetCustomers: "QSR chains, food courts, cloud kitchens, caterers, events, college canteens",
      usages: "Fast bubble tea service, takeaway shops, food court counters, event beverage stalls",
      keyBenefits: "Ready in 5 minutes vs 30 min standard, reduces prep time 80%, ideal for high-volume service",
      hsnCode: "1903", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 kg pouch", packSize: "1 kg", shelfLife: "24 months", sortOrder: 2 },

    { sku: "TP-MINI-1KG", name: "Mini Tapioca Pearls", categoryId: tapiocaCat!.id,
      description: "Small-sized tapioca pearls — perfect for straws, smoothies and desserts where smaller pearls work better.",
      targetCustomers: "specialty bubble tea shops, dessert parlours, cafes, dessert delivery brands",
      usages: "Mini boba drinks, dessert toppings, puddings, smoothies with standard straws",
      keyBenefits: "Works with regular straws — no wide straw needed, perfect for delivery packaging, dessert versatility",
      hsnCode: "1903", gstRate: 18, mrp: 340, dealerPrice: 230, moq: "1 kg pouch", packSize: "1 kg", shelfLife: "24 months", sortOrder: 3 },

    { sku: "TP-WHITE-1KG", name: "White Tapioca Pearls", categoryId: tapiocaCat!.id,
      description: "Translucent white tapioca pearls — elegant appearance for premium and PAN Asian menu presentations.",
      targetCustomers: "premium bubble tea shops, Japanese cafes, PAN Asian restaurants, premium hotels",
      usages: "Premium bubble tea, clear milk tea, dessert cups, Asian-fusion presentations",
      keyBenefits: "Premium transparent look for upscale menus, lets beverage colour show through beautifully",
      hsnCode: "1903", gstRate: 18, mrp: 350, dealerPrice: 240, moq: "1 kg pouch", packSize: "1 kg", shelfLife: "24 months", sortOrder: 4 },

    { sku: "TP-BROWN-SUGAR-1KG", name: "Brown Sugar Flavoured Tapioca Pearls", categoryId: tapiocaCat!.id,
      description: "Pre-flavoured brown sugar tapioca pearls — ready to serve, no separate syrup needed.",
      targetCustomers: "bubble tea shops, cafes, QSR chains, cloud kitchens, dessert stores",
      usages: "Brown sugar boba directly in drinks, tiger milk tea, brown sugar desserts, quick service",
      keyBenefits: "No separate brown sugar syrup needed, saves prep step, consistent flavour every time",
      hsnCode: "1903", gstRate: 18, mrp: 400, dealerPrice: 280, moq: "1 kg pouch", packSize: "1 kg", shelfLife: "18 months", sortOrder: 5 },

    // ════════════════════════════════════════════════════════════════════════════
    // MILKSHAKE & LASSI MIXES
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "ML-MANGO-LASSI-500", name: "Mango Lassi Mix", categoryId: milkshakeCat!.id,
      description: "Premium mango lassi premix — authentic Indian taste in seconds. Just blend with curd or milk.",
      targetCustomers: "Indian restaurants, dhabas, hotels, juice bars, canteens, cloud kitchens, caterers",
      usages: "Mango lassi, mango smoothie, mango milkshake, festive menus, takeaway drinks",
      keyBenefits: "Authentic mango taste, fast prep, high festive demand (weddings, Diwali, Eid), no fruit blending needed",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 pouch (500g)", packSize: "500g (approx. 15 servings)", shelfLife: "12 months", sortOrder: 1 },

    { sku: "ML-COOKIES-CREAM-500", name: "Cookies & Cream Milkshake Mix", categoryId: milkshakeCat!.id,
      description: "Indulgent cookies and cream milkshake premix — a café favourite for millennials.",
      targetCustomers: "cafes, dessert parlours, ice cream shops, QSR chains, multiplexes, college canteens",
      usages: "Thick milkshake, dessert drink, frappé base, boba milkshake, celebration drink",
      keyBenefits: "Café-quality shake without ice cream machine, millennial favourite, high-margin dessert drink",
      hsnCode: "2106", gstRate: 18, mrp: 420, dealerPrice: 290, moq: "1 pouch (500g)", packSize: "500g", shelfLife: "12 months", sortOrder: 2 },

    { sku: "ML-BUTTERSCOTCH-500", name: "Butterscotch Milkshake Mix", categoryId: milkshakeCat!.id,
      description: "Classic butterscotch milkshake premix — perennial crowd-pleaser across all age groups.",
      targetCustomers: "cafes, restaurants, QSR chains, ice cream shops, canteens, cloud kitchens",
      usages: "Butterscotch milkshake, butterscotch frappe, dessert base, birthday party drinks",
      keyBenefits: "Universal appeal, top-10 milkshake flavour nationwide, high repeat purchase",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 pouch (500g)", packSize: "500g", shelfLife: "12 months", sortOrder: 3 },

    { sku: "ML-CHOCOLATE-SHAKE-500", name: "Chocolate Milkshake Mix", categoryId: milkshakeCat!.id,
      description: "Rich chocolate milkshake premix — the perennial bestseller, loved by kids and adults alike.",
      targetCustomers: "cafes, QSR chains, ice cream shops, restaurants, multiplexes, fast food outlets",
      usages: "Thick chocolate milkshake, chocolate frappe, choco smoothie, birthday drinks",
      keyBenefits: "India's #1 milkshake flavour, high volume SKU, works as standalone and cross-sell item",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 pouch (500g)", packSize: "500g", shelfLife: "12 months", sortOrder: 4 },

    { sku: "ML-STRAWBERRY-SHAKE-500", name: "Strawberry Milkshake Mix", categoryId: milkshakeCat!.id,
      description: "Classic strawberry milkshake premix with natural strawberry flavour and pink colour.",
      targetCustomers: "cafes, QSR chains, ice cream parlours, children-focused venues, cloud kitchens",
      usages: "Strawberry milkshake, strawberry smoothie, strawberry frappe, kids menu, party drinks",
      keyBenefits: "Kids & family favourite, attractive pink colour, consistent flavour every batch",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 pouch (500g)", packSize: "500g", shelfLife: "12 months", sortOrder: 5 },

    { sku: "ML-KESAR-PISTA-500", name: "Kesar Pista Milkshake Mix", categoryId: milkshakeCat!.id,
      description: "Premium saffron-pistachio milkshake mix — festive, royal and high-ticket item for Indian menus.",
      targetCustomers: "premium restaurants, sweet shops, wedding caterers, hotels, festive menus, gifting brands",
      usages: "Kesar pista shake, festive milkshake, wedding catering, premium dessert drink, gift hampers",
      keyBenefits: "Premium pricing power due to saffron ingredient, high festive/wedding demand, luxury positioning",
      hsnCode: "2106", gstRate: 18, mrp: 480, dealerPrice: 340, moq: "1 pouch (500g)", packSize: "500g", shelfLife: "12 months", sortOrder: 6 },

    { sku: "ML-SWEET-LASSI-500", name: "Sweet Lassi Mix", categoryId: milkshakeCat!.id,
      description: "Traditional sweet lassi premix — authentic Punjab-style lassi in seconds.",
      targetCustomers: "Punjabi restaurants, dhabas, hotels, canteens, Indian fast food chains",
      usages: "Sweet lassi, plain lassi, lassi with meals, summer menu, lunch specials",
      keyBenefits: "Authentic Punjabi taste, highest volume lassi SKU, pairs with every North Indian meal",
      hsnCode: "2106", gstRate: 18, mrp: 320, dealerPrice: 215, moq: "1 pouch (500g)", packSize: "500g", shelfLife: "12 months", sortOrder: 7 },

    { sku: "ML-ROSE-SHAKE-500", name: "Rose Milkshake Mix", categoryId: milkshakeCat!.id,
      description: "Fragrant rose milkshake premix — pink, floral and elegant. High demand at weddings and festive events.",
      targetCustomers: "wedding caterers, sweet shops, premium cafes, events, mithai parlours",
      usages: "Rose milkshake, rose falooda base, festive drink, wedding banquet beverage",
      keyBenefits: "Festive and wedding demand spike, premium floral positioning, beautiful pink colour",
      hsnCode: "2106", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 pouch (500g)", packSize: "500g", shelfLife: "12 months", sortOrder: 8 },

    // ════════════════════════════════════════════════════════════════════════════
    // MOCKTAIL & LEMONADE MIXES
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "MM-VIRGIN-MOJITO-750ML", name: "Virgin Mojito Mix", categoryId: mocktailCat!.id,
      description: "Ready-to-mix virgin mojito concentrate with real mint and lime. India's most ordered mocktail.",
      targetCustomers: "restaurants, cafes, bars, hotels, resorts, event caterers, cloud kitchens, wedding venues",
      usages: "Virgin mojito, sparkling lemonade, mocktail pitcher, event drinks, party beverages",
      keyBenefits: "#1 selling mocktail flavour, real mint-lime taste, fast service, consistent every glass",
      hsnCode: "2106", gstRate: 18, mrp: 300, dealerPrice: 200, moq: "1 bottle (750ml)", packSize: "750ml bottle (25–30 servings)", shelfLife: "18 months", sortOrder: 1 },

    { sku: "MM-WATERMELON-LEMONADE-750ML", name: "Watermelon Lemonade Mix", categoryId: mocktailCat!.id,
      description: "Vibrant watermelon lemonade concentrate — refreshing summer bestseller with eye-catching pink colour.",
      targetCustomers: "cafes, juice bars, restaurants, resorts, beach clubs, food festivals, cloud kitchens",
      usages: "Watermelon lemonade, sparkling watermelon soda, pink mocktail, summer menu feature",
      keyBenefits: "Striking pink colour drives Instagram sharing, summer bestseller, zero prep required",
      hsnCode: "2106", gstRate: 18, mrp: 280, dealerPrice: 190, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 2 },

    { sku: "MM-BLUE-LAGOON-750ML", name: "Blue Lagoon Mocktail Mix", categoryId: mocktailCat!.id,
      description: "Electric blue mocktail mix — the most visually striking drink for bars and events.",
      targetCustomers: "bars, mocktail bars, event venues, restaurants, hotels, beach resorts, multiplexes",
      usages: "Blue lagoon mocktail, blue lemonade, event drinks, bar menu feature, poolside drinks",
      keyBenefits: "Unmissable blue colour drives impulse orders, extremely high Instagram shareability, premium bar positioning",
      hsnCode: "2106", gstRate: 18, mrp: 310, dealerPrice: 210, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 3 },

    { sku: "MM-KIWI-MINT-750ML", name: "Kiwi Mint Mojito Mix", categoryId: mocktailCat!.id,
      description: "Fresh kiwi mint mocktail concentrate — zesty, bright green and refreshing.",
      targetCustomers: "cafes, restaurants, bars, health cafes, resorts, event caterers",
      usages: "Kiwi mojito, kiwi lemonade, green mocktail, health-positioned drink, summer menu",
      keyBenefits: "Vibrant green colour, health-fruit positioning, unique flavour differentiates the menu",
      hsnCode: "2106", gstRate: 18, mrp: 300, dealerPrice: 200, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 4 },

    { sku: "MM-PEACH-BELLINI-750ML", name: "Peach Bellini Mocktail Mix", categoryId: mocktailCat!.id,
      description: "Sophisticated peach bellini mocktail mix — premium fine-dining and event positioning.",
      targetCustomers: "fine dining restaurants, premium hotels, wedding caterers, corporate events, roof-top bars",
      usages: "Peach bellini mocktail, brunch drinks, wedding toasts, corporate events, premium menus",
      keyBenefits: "Premium event and wedding positioning, sophisticated flavour profile, high ticket price justification",
      hsnCode: "2106", gstRate: 18, mrp: 340, dealerPrice: 230, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 5 },

    { sku: "MM-MANGO-MOJITO-750ML", name: "Mango Mojito Mix", categoryId: mocktailCat!.id,
      description: "Tropical mango mojito mocktail mix — India's summer twist on the classic mojito.",
      targetCustomers: "cafes, restaurants, bars, hotels, resorts, beach clubs, cloud kitchens",
      usages: "Mango mojito, mango sparkling drink, mango mocktail pitcher, summer menu",
      keyBenefits: "Iconic Indian summer flavour, pairs with mango-themed menus, high demand April–July",
      hsnCode: "2106", gstRate: 18, mrp: 290, dealerPrice: 195, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 6 },

    { sku: "MM-ROSE-LEMONADE-750ML", name: "Rose Lemonade Mix", categoryId: mocktailCat!.id,
      description: "Elegant rose lemonade mix — pink, floral and refreshing. High demand at wedding and festive events.",
      targetCustomers: "wedding caterers, premium cafes, events, hotels, sweet shops, bakeries",
      usages: "Rose lemonade, floral mocktail, wedding welcome drink, festive menu, gifting hampers",
      keyBenefits: "Premium event positioning, elegant pink colour, high demand at weddings and festive seasons",
      hsnCode: "2106", gstRate: 18, mrp: 300, dealerPrice: 200, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 7 },

    { sku: "MM-PAAN-SHOTS-750ML", name: "Paan Shots Mix", categoryId: mocktailCat!.id,
      description: "Unique paan-flavoured mocktail shots mix — an Indian hospitality staple for after-dinner service.",
      targetCustomers: "Indian restaurants, wedding caterers, mithai shops, event caterers, dhabas",
      usages: "Paan shots, paan welcome drink, after-dinner digestif, event catering, Indian wedding menus",
      keyBenefits: "Uniquely Indian flavour with strong cultural relevance, high demand at weddings and events, digestive positioning",
      hsnCode: "2106", gstRate: 18, mrp: 280, dealerPrice: 185, moq: "1 bottle (750ml)", packSize: "750ml bottle", shelfLife: "18 months", sortOrder: 8 },

    // ════════════════════════════════════════════════════════════════════════════
    // BOBA DESSERTS
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "BD-TARO-JAR-CAKE", name: "Taro Jar Cake Mix", categoryId: dessertCat!.id,
      description: "Taro-flavoured jar cake premix — easy to assemble, stunning to present, premium pricing for cafes.",
      targetCustomers: "dessert cafes, bakeries, cloud kitchens, restaurants, hotels, caterers, gifting businesses",
      usages: "Individual dessert jars, takeaway desserts, corporate gifting, café dessert menu, online delivery",
      keyBenefits: "No oven needed, Instagram-worthy presentation, high-margin dessert, café menu differentiator",
      hsnCode: "1901", gstRate: 18, mrp: 320, dealerPrice: 210, moq: "1 pack (makes 10 jars)", packSize: "Pack for 10 servings", shelfLife: "6 months", sortOrder: 1 },

    { sku: "BD-MATCHA-JAR-CAKE", name: "Matcha Jar Cake Mix", categoryId: dessertCat!.id,
      description: "Matcha-flavoured jar cake premix — Japanese-inspired green elegance for premium dessert menus.",
      targetCustomers: "specialty cafes, dessert stores, bakeries, Japanese restaurants, premium hotels",
      usages: "Matcha dessert jars, café dessert menu, delivery desserts, gifting, matcha-themed menus",
      keyBenefits: "Premium matcha trend alignment, Instagram-worthy green colour, pairs with matcha beverage menu",
      hsnCode: "1901", gstRate: 18, mrp: 340, dealerPrice: 225, moq: "1 pack (makes 10 jars)", packSize: "Pack for 10 servings", shelfLife: "6 months", sortOrder: 2 },

    { sku: "BD-STRAWBERRY-JAR-CAKE", name: "Strawberry Jar Cake Mix", categoryId: dessertCat!.id,
      description: "Sweet strawberry jar cake premix — pink, pretty and perfect for celebrations and gifting.",
      targetCustomers: "dessert cafes, bakeries, cloud kitchens, birthday venues, event caterers",
      usages: "Strawberry dessert jars, birthday celebrations, Valentine's Day, gifting, café dessert menu",
      keyBenefits: "Pink colour perfect for birthdays and Valentine's, high gifting demand, delivery-friendly format",
      hsnCode: "1901", gstRate: 18, mrp: 320, dealerPrice: 210, moq: "1 pack (makes 10 jars)", packSize: "Pack for 10 servings", shelfLife: "6 months", sortOrder: 3 },

    { sku: "BD-MATCHA-SWISS-ROLL", name: "Matcha Swiss Roll Mix", categoryId: dessertCat!.id,
      description: "Matcha-flavoured Swiss roll premix — premium Japanese-inspired dessert for high-end bakery menus.",
      targetCustomers: "bakeries, dessert cafes, specialty cafes, hotels, cloud kitchens, patisseries",
      usages: "Swiss roll cakes, dessert platters, afternoon tea menus, premium takeaway items",
      keyBenefits: "Japanese flavour trend, premium aesthetic, differentiates bakeries, pairs with matcha beverage menu",
      hsnCode: "1901", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 pack", packSize: "Pack for 8–10 servings", shelfLife: "6 months", sortOrder: 4 },

    { sku: "BD-TARO-SWISS-ROLL", name: "Taro Swiss Roll Mix", categoryId: dessertCat!.id,
      description: "Taro-flavoured Swiss roll premix — purple-hued, creamy and delicious.",
      targetCustomers: "bakeries, dessert cafes, cloud kitchens, hotels, PAN Asian restaurants",
      usages: "Taro Swiss roll, dessert menu, takeaway sweets, boba dessert pairing, café display",
      keyBenefits: "Stunning purple colour, trending taro flavour, pairs with taro bubble tea for upsell",
      hsnCode: "1901", gstRate: 18, mrp: 380, dealerPrice: 260, moq: "1 pack", packSize: "Pack for 8–10 servings", shelfLife: "6 months", sortOrder: 5 },

    { sku: "BD-MOCHI-MIX-500G", name: "Mochi Dough Mix", categoryId: dessertCat!.id,
      description: "Japanese mochi dough premix — chewy, soft rice-cake texture for mochi ice cream and filled mochi.",
      targetCustomers: "dessert cafes, PAN Asian restaurants, premium hotels, Japanese cafes, bakeries",
      usages: "Mochi ice cream wrapping, filled mochi, mochi desserts, Japanese dessert menus",
      keyBenefits: "Trending Japanese dessert format, premium price point, unique menu differentiation, high Instagram value",
      hsnCode: "1901", gstRate: 18, mrp: 450, dealerPrice: 310, moq: "1 pouch (500g)", packSize: "500g (makes 20–25 mochi pieces)", shelfLife: "9 months", sortOrder: 6 },

    // ════════════════════════════════════════════════════════════════════════════
    // INDUSTRIAL INGREDIENTS (Bulk 20kg)
    // ════════════════════════════════════════════════════════════════════════════

    { sku: "IND-POPPING-BOBA-20KG", name: "Popping Boba — Bulk 20kg Bucket", categoryId: industrialCat!.id,
      description: "Bulk popping boba in 20kg food-grade buckets. Available in mango, strawberry, lychee, passion fruit, blueberry, orange.",
      targetCustomers: "large QSR chains, hotel groups, food manufacturers, distributors, large caterers",
      usages: "High-volume bubble tea, dessert manufacturing, food service chains, co-packing",
      keyBenefits: "60–70% lower per-kg cost vs retail packs, FSSC 22000 certified, HALAL certified, bulk pricing",
      hsnCode: "2106", gstRate: 18, mrp: null, dealerPrice: null, moq: "1 bucket (20kg) — call for pricing", packSize: "20kg food-grade bucket", shelfLife: "12 months", sortOrder: 1 },

    { sku: "IND-TAPIOCA-PEARLS-20KG", name: "Tapioca Pearls — Bulk 20kg Pack", categoryId: industrialCat!.id,
      description: "Bulk tapioca pearls for large bubble tea chains and food manufacturers. Consistent size and cook time.",
      targetCustomers: "QSR chains, hotel groups, food manufacturers, large distributors, cloud kitchen brands",
      usages: "Chain-level bubble tea production, central kitchen supply, food manufacturing",
      keyBenefits: "Consistent pearl size and cook time, bulk pricing, FSSAI certified, direct manufacturer pricing",
      hsnCode: "1903", gstRate: 18, mrp: null, dealerPrice: null, moq: "1 pack (20kg) — call for pricing", packSize: "20kg pack", shelfLife: "24 months", sortOrder: 2 },

    { sku: "IND-KONJAC-PEARLS-20KG", name: "Konjac Pearls — Bulk 20kg Bucket", categoryId: industrialCat!.id,
      description: "Konjac jelly pearls in bulk — lower calorie alternative to tapioca, growing in health-focused menus.",
      targetCustomers: "health-focused QSR chains, wellness cafes, distributors, food manufacturers",
      usages: "Low-calorie boba drinks, health menu positioning, vegan desserts, konjac-based products",
      keyBenefits: "Health & diet positioning (lower calorie than tapioca), vegan-certified, growing niche segment",
      hsnCode: "2106", gstRate: 18, mrp: null, dealerPrice: null, moq: "1 bucket (20kg) — call for pricing", packSize: "20kg food-grade bucket", shelfLife: "12 months", sortOrder: 3 },

    { sku: "IND-NATA-DE-COCO-20KG", name: "Nata de Coco — Bulk 20kg Bucket", categoryId: industrialCat!.id,
      description: "Coconut jelly cubes in bulk — chewy, light and refreshing topping for drinks and desserts.",
      targetCustomers: "QSR chains, dessert manufacturers, hotels, distributors, food processors",
      usages: "Drink topping, dessert mixing, fruit cocktails, puddings, bubble tea alternative topping",
      keyBenefits: "Light refreshing texture, natural coconut origin story, vegan and HALAL, versatile across applications",
      hsnCode: "2106", gstRate: 18, mrp: null, dealerPrice: null, moq: "1 bucket (20kg) — call for pricing", packSize: "20kg food-grade bucket", shelfLife: "12 months", sortOrder: 4 },

    { sku: "IND-BROWN-SUGAR-SYR-20KG", name: "Brown Sugar Syrup — Bulk 20kg", categoryId: industrialCat!.id,
      description: "Bulk brown sugar syrup for large-scale tiger milk tea and brown sugar boba production.",
      targetCustomers: "large bubble tea chains, hotel groups, food manufacturers, distributors",
      usages: "Tiger milk tea production, brown sugar boba at scale, dessert manufacturing, central kitchen",
      keyBenefits: "Bulk cost savings 50%+ vs retail, consistent flavour across all outlets, industrial food-grade quality",
      hsnCode: "1702", gstRate: 18, mrp: null, dealerPrice: null, moq: "1 bucket (20kg) — call for pricing", packSize: "20kg food-grade bucket", shelfLife: "18 months", sortOrder: 5 },
  ];

  for (const product of products) {
    await db.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name, categoryId: product.categoryId, description: product.description,
        targetCustomers: product.targetCustomers, usages: product.usages, keyBenefits: product.keyBenefits,
        hsnCode: product.hsnCode, gstRate: product.gstRate, mrp: product.mrp, dealerPrice: product.dealerPrice,
        moq: product.moq, packSize: product.packSize, shelfLife: product.shelfLife, sortOrder: product.sortOrder,
      },
      create: product,
    });
  }

  console.log(`Seeded ${products.length} products across ${categories.length} categories`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
