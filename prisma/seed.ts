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
    { name: "Boba Bubble Tea Premixes", description: "Ready-to-use premix powders for making boba/bubble tea drinks", sortOrder: 1 },
    { name: "Instant Tea Premixes", description: "Instant tea and milk tea premix powders for HoReCa and retail", sortOrder: 2 },
    { name: "Fruit-Based Beverages", description: "Fruit syrups, concentrates and flavoured drink bases", sortOrder: 3 },
    { name: "Coffee Premixes", description: "Instant coffee and specialty coffee drink premixes", sortOrder: 4 },
    { name: "Dairy & Milk Beverages", description: "Milk-based drink premixes including shakes and smoothies", sortOrder: 5 },
    { name: "Health & Wellness", description: "Herbal, functional and nutraceutical beverage premixes", sortOrder: 6 },
  ];

  for (const cat of categories) {
    await db.productCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
  }

  const bobaCat = await db.productCategory.findUnique({ where: { name: "Boba Bubble Tea Premixes" } });
  const instantTeaCat = await db.productCategory.findUnique({ where: { name: "Instant Tea Premixes" } });
  const fruitCat = await db.productCategory.findUnique({ where: { name: "Fruit-Based Beverages" } });
  const coffeeCat = await db.productCategory.findUnique({ where: { name: "Coffee Premixes" } });
  const dairyCat = await db.productCategory.findUnique({ where: { name: "Dairy & Milk Beverages" } });
  const healthCat = await db.productCategory.findUnique({ where: { name: "Health & Wellness" } });

  const products = [
    // ── Boba Bubble Tea ────────────────────────────────────────────────────────
    {
      sku: "BBT-TARO-500",
      name: "Taro Bubble Tea Premix",
      categoryId: bobaCat!.id,
      description: "Classic taro-flavoured boba bubble tea premix. Just add hot water and tapioca pearls.",
      targetCustomers: "cafes, bubble tea shops, QSR chains, food courts, hotels, restaurants",
      usages: "Bubble tea shops, café menu extension, street food stalls, cloud kitchens, canteens",
      keyBenefits: "No blender required, consistent taste every batch, long shelf life, easy training for staff, high margin drink",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 450,
      dealerPrice: 320,
      moq: "1 pouch (500g)",
      packSize: "500g pouch (approx. 20 servings)",
      shelfLife: "12 months",
      sortOrder: 1,
    },
    {
      sku: "BBT-MANGO-500",
      name: "Mango Bubble Tea Premix",
      categoryId: bobaCat!.id,
      description: "Tropical mango flavoured boba premix — a bestseller for summer menus.",
      targetCustomers: "cafes, bubble tea shops, QSR chains, hotels, resorts, juice bars",
      usages: "Bubble tea, iced mango tea, mango slushie base, party drinks",
      keyBenefits: "Natural mango flavour, no artificial colours, fast preparation, high demand SKU",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 450,
      dealerPrice: 320,
      moq: "1 pouch (500g)",
      packSize: "500g pouch",
      shelfLife: "12 months",
      sortOrder: 2,
    },
    {
      sku: "BBT-MATCHA-500",
      name: "Matcha Bubble Tea Premix",
      categoryId: bobaCat!.id,
      description: "Japanese-style matcha green tea bubble tea premix. Growing demand among health-conscious consumers.",
      targetCustomers: "specialty cafes, health cafes, yoga studios, wellness centres, premium hotels",
      usages: "Hot/cold matcha latte, matcha boba, matcha smoothie",
      keyBenefits: "Authentic matcha flavour, health positioning, premium pricing potential, trending product",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 520,
      dealerPrice: 370,
      moq: "1 pouch (500g)",
      packSize: "500g pouch",
      shelfLife: "12 months",
      sortOrder: 3,
    },
    {
      sku: "BBT-STRAWBERRY-500",
      name: "Strawberry Bubble Tea Premix",
      categoryId: bobaCat!.id,
      description: "Sweet strawberry boba premix perfect for dessert cafes and sweet shops.",
      targetCustomers: "dessert cafes, bakeries, ice cream parlours, bubble tea shops, college canteens",
      usages: "Boba drinks, strawberry iced tea, dessert drinks, smoothie base",
      keyBenefits: "Appealing pink colour, popular with young customers, easy cross-sell with desserts",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 450,
      dealerPrice: 320,
      moq: "1 pouch (500g)",
      packSize: "500g pouch",
      shelfLife: "12 months",
      sortOrder: 4,
    },
    {
      sku: "BBT-CHOCO-500",
      name: "Chocolate Bubble Tea Premix",
      categoryId: bobaCat!.id,
      description: "Rich chocolate boba premix — combines the chocolate shake experience with bubble tea format.",
      targetCustomers: "cafes, dessert parlours, QSR, college canteens, birthday venues",
      usages: "Chocolate boba, hot chocolate boba, choco shake, dessert drink",
      keyBenefits: "Universal appeal, works hot and cold, high repeat purchase rate",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 480,
      dealerPrice: 340,
      moq: "1 pouch (500g)",
      packSize: "500g pouch",
      shelfLife: "12 months",
      sortOrder: 5,
    },
    // ── Instant Tea ────────────────────────────────────────────────────────────
    {
      sku: "IT-MASALA-1KG",
      name: "Masala Chai Premix",
      categoryId: instantTeaCat!.id,
      description: "Traditional Indian masala chai premix with real spices — cardamom, ginger, cinnamon and more.",
      targetCustomers: "office canteens, hotels, roadside dhabas, airports, hospital cafeterias, corporate offices",
      usages: "Vending machines, bulk institutional supply, takeaway chai stalls, hospitality sector",
      keyBenefits: "Authentic taste, consistent quality, no brewing required, ideal for vending, very high volume SKU",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 380,
      dealerPrice: 260,
      moq: "1 kg pouch",
      packSize: "1 kg (approx. 100 cups)",
      shelfLife: "18 months",
      sortOrder: 1,
    },
    {
      sku: "IT-GINGER-1KG",
      name: "Ginger Tea Premix",
      categoryId: instantTeaCat!.id,
      description: "Zingy ginger tea premix — soothing and spicy. Very popular during monsoon and winter seasons.",
      targetCustomers: "offices, hospitals, hotels, airlines, railways, canteens",
      usages: "Hot beverage service, vending, wellness menus, airline/railway catering",
      keyBenefits: "High seasonal demand, wellness positioning, immunity angle for marketing",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 360,
      dealerPrice: 250,
      moq: "1 kg pouch",
      packSize: "1 kg",
      shelfLife: "18 months",
      sortOrder: 2,
    },
    {
      sku: "IT-ELAICHI-1KG",
      name: "Elaichi (Cardamom) Tea Premix",
      categoryId: instantTeaCat!.id,
      description: "Fragrant cardamom tea — premium chai experience in seconds.",
      targetCustomers: "premium hotels, offices, cafes, households, gifting",
      usages: "Hospitality chai service, corporate gifting, premium vending",
      keyBenefits: "Luxury positioning, gifting SKU potential, distinct fragrance = brand recall",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 400,
      dealerPrice: 280,
      moq: "1 kg pouch",
      packSize: "1 kg",
      shelfLife: "18 months",
      sortOrder: 3,
    },
    // ── Fruit Beverages ────────────────────────────────────────────────────────
    {
      sku: "FB-LYCHEE-SYR-750",
      name: "Lychee Syrup",
      categoryId: fruitCat!.id,
      description: "Premium lychee flavour syrup for mocktails, bubble tea, and fruit drinks.",
      targetCustomers: "cocktail/mocktail bars, cafes, restaurants, hotels, bubble tea shops",
      usages: "Mocktails, lychee iced tea, bubble tea flavouring, dessert topping, lemonade mixer",
      keyBenefits: "Versatile — works across multiple drinks, premium appearance, low cost per serve",
      hsnCode: "2106",
      gstRate: 18,
      mrp: 320,
      dealerPrice: 220,
      moq: "1 bottle (750ml)",
      packSize: "750ml bottle",
      shelfLife: "24 months",
      sortOrder: 1,
    },
    {
      sku: "FB-PASSION-SYR-750",
      name: "Passion Fruit Syrup",
      categoryId: fruitCat!.id,
      description: "Tangy passion fruit syrup — trending flavour in the cafe and bar segment.",
      targetCustomers: "cafes, bars, restaurants, beach resorts, juice bars",
      usages: "Mocktails, passion fruit iced tea, tropical drinks, cocktail mixers",
      keyBenefits: "Trending tropical flavour, Instagram-worthy yellow colour, high margin drinks",
      hsnCode: "2106",
      gstRate: 18,
      mrp: 340,
      dealerPrice: 230,
      moq: "1 bottle (750ml)",
      packSize: "750ml bottle",
      shelfLife: "24 months",
      sortOrder: 2,
    },
    // ── Coffee Premixes ────────────────────────────────────────────────────────
    {
      sku: "CF-CAPPUCCINO-1KG",
      name: "Cappuccino Premix",
      categoryId: coffeeCat!.id,
      description: "Rich and frothy cappuccino premix — barista-quality coffee in seconds.",
      targetCustomers: "offices, hotels, cafes, vending operators, co-working spaces, IT parks",
      usages: "Hot cappuccino, iced cappuccino, frothy drinks, vending machines",
      keyBenefits: "Consistent taste, no espresso machine needed, great for vending ROI",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 560,
      dealerPrice: 390,
      moq: "1 kg pouch",
      packSize: "1 kg (approx. 80 cups)",
      shelfLife: "18 months",
      sortOrder: 1,
    },
    {
      sku: "CF-MOCHA-1KG",
      name: "Mocha Coffee Premix",
      categoryId: coffeeCat!.id,
      description: "Chocolate-coffee blend — one of the most popular coffee drinks among millennials.",
      targetCustomers: "cafes, restaurants, co-working spaces, colleges, multiplexes",
      usages: "Hot/iced mocha, mocha shake, dessert drink",
      keyBenefits: "Cross-sells with chocolate desserts, millennial favourite, premium positioning",
      hsnCode: "2101",
      gstRate: 18,
      mrp: 580,
      dealerPrice: 410,
      moq: "1 kg pouch",
      packSize: "1 kg",
      shelfLife: "18 months",
      sortOrder: 2,
    },
    // ── Dairy & Milk ────────────────────────────────────────────────────────────
    {
      sku: "DM-BADAM-500",
      name: "Badam (Almond) Milk Premix",
      categoryId: dairyCat!.id,
      description: "Royal almond milk premix with real badam, saffron notes and cardamom.",
      targetCustomers: "sweet shops, mithai parlours, temples, hotels, Ayurvedic centres, gifting",
      usages: "Hot/cold badam doodh, special occasion drink, festive menus, health drink",
      keyBenefits: "Festive demand spike (Diwali, Eid, weddings), premium pricing, gifting SKU",
      hsnCode: "1901",
      gstRate: 18,
      mrp: 420,
      dealerPrice: 290,
      moq: "1 pouch (500g)",
      packSize: "500g pouch",
      shelfLife: "12 months",
      sortOrder: 1,
    },
    // ── Health & Wellness ──────────────────────────────────────────────────────
    {
      sku: "HW-ASHWAGANDHA-250",
      name: "Ashwagandha Herbal Tea Premix",
      categoryId: healthCat!.id,
      description: "Stress-relieving adaptogenic herbal tea with ashwagandha, tulsi, and ginger.",
      targetCustomers: "health stores, yoga studios, Ayurvedic clinics, corporate wellness, pharmacies",
      usages: "Morning wellness drink, stress management tea, immunity booster, corporate wellness programs",
      keyBenefits: "Trending adaptogen category, D2C potential, premium margin, corporate wellness angle",
      hsnCode: "2101",
      gstRate: 5,
      mrp: 380,
      dealerPrice: 260,
      moq: "1 pouch (250g)",
      packSize: "250g (25 sachets x 10g)",
      shelfLife: "24 months",
      sortOrder: 1,
    },
  ];

  for (const product of products) {
    await db.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        targetCustomers: product.targetCustomers,
        usages: product.usages,
        keyBenefits: product.keyBenefits,
        hsnCode: product.hsnCode,
        gstRate: product.gstRate,
        mrp: product.mrp,
        dealerPrice: product.dealerPrice,
        moq: product.moq,
        packSize: product.packSize,
        shelfLife: product.shelfLife,
        sortOrder: product.sortOrder,
      },
      create: product,
    });
  }

  console.log(`Seeded ${products.length} products across ${categories.length} categories`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
