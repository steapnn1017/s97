from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result['id'] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

# ===================== MODELS =====================

class ProductTranslation(BaseModel):
    name: str
    description: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image: Optional[str] = None  # base64 image
    sizes: List[str] = ["S", "M", "L", "XL"]
    colors: List[str] = ["Black", "White"]
    translations: Optional[Dict[str, ProductTranslation]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    sizes: Optional[List[str]] = None
    colors: Optional[List[str]] = None
    translations: Optional[Dict[str, ProductTranslation]] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1
    size: str = "M"
    color: str = "Black"

class CartUpdate(BaseModel):
    items: List[CartItem]

class ShippingInfo(BaseModel):
    full_name: str
    email: str
    address: str
    city: str
    postal_code: str
    country: str
    phone: Optional[str] = None

class CheckoutRequest(BaseModel):
    session_id: str
    shipping_info: ShippingInfo
    origin_url: str
    discount_code: Optional[str] = None
    shipping_method: str = "standard"

# ===================== PRODUCT ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"message": "SIERRA 97 SX API", "status": "running"}

@api_router.get("/products")
async def get_products(category: Optional[str] = None):
    """Get all products, optionally filtered by category"""
    query = {}
    if category:
        query["category"] = category
    
    products = await db.products.find(query).to_list(100)
    return serialize_doc(products)

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return serialize_doc(product)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/products")
async def create_product(product: ProductCreate):
    """Create a new product (Admin)"""
    product_dict = product.dict()
    product_dict["created_at"] = datetime.utcnow()
    product_dict["updated_at"] = datetime.utcnow()
    
    result = await db.products.insert_one(product_dict)
    product_dict["id"] = str(result.inserted_id)
    return serialize_doc(product_dict)

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate):
    """Update a product (Admin)"""
    try:
        update_data = {k: v for k, v in product.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
        return serialize_doc(updated_product)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product (Admin)"""
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/categories")
async def get_categories():
    """Get all unique categories"""
    categories = await db.products.distinct("category")
    return categories

# ===================== CART ENDPOINTS =====================

@api_router.get("/cart/{session_id}")
async def get_cart(session_id: str):
    """Get cart by session ID"""
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        # Create empty cart
        cart = {
            "session_id": session_id,
            "items": [],
            "total": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.carts.insert_one(cart)
    
    # Populate product details for each item
    populated_items = []
    for item in cart.get("items", []):
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
            if product:
                populated_items.append({
                    **item,
                    "product": serialize_doc(product)
                })
        except:
            continue
    
    cart["items"] = populated_items
    return serialize_doc(cart)

@api_router.post("/cart/{session_id}")
async def update_cart(session_id: str, cart_update: CartUpdate):
    """Update cart items"""
    # Calculate total
    total = 0.0
    items_data = []
    
    for item in cart_update.items:
        try:
            product = await db.products.find_one({"_id": ObjectId(item.product_id)})
            if product:
                total += product["price"] * item.quantity
                items_data.append(item.dict())
        except:
            continue
    
    cart_data = {
        "session_id": session_id,
        "items": items_data,
        "total": round(total, 2),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.carts.update_one(
        {"session_id": session_id},
        {"$set": cart_data, "$setOnInsert": {"created_at": datetime.utcnow()}},
        upsert=True
    )
    
    return await get_cart(session_id)

@api_router.delete("/cart/{session_id}")
async def clear_cart(session_id: str):
    """Clear cart"""
    await db.carts.update_one(
        {"session_id": session_id},
        {"$set": {"items": [], "total": 0.0, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Cart cleared"}

# ===================== CHECKOUT ENDPOINTS =====================

@api_router.post("/checkout/create-session")
async def create_checkout_session(request: Request, checkout_request: CheckoutRequest):
    """Create a Stripe checkout session"""
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse
    )
    
    # Get cart
    cart = await db.carts.find_one({"session_id": checkout_request.session_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate subtotal from backend (security - don't trust frontend)
    subtotal = 0.0
    for item in cart.get("items", []):
        try:
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
            if product:
                subtotal += product["price"] * item["quantity"]
        except:
            continue
    
    if subtotal <= 0:
        raise HTTPException(status_code=400, detail="Invalid cart total")
    
    # Apply discount code
    discount_amount = 0.0
    discount_info = None
    if checkout_request.discount_code:
        code = checkout_request.discount_code.upper()
        if code in DISCOUNT_CODES:
            discount_info = DISCOUNT_CODES[code]
            if discount_info["type"] == "percentage":
                discount_amount = subtotal * (discount_info["value"] / 100)
            elif discount_info["type"] == "fixed":
                discount_amount = min(discount_info["value"], subtotal)
    
    # Add shipping cost
    shipping_cost = SHIPPING_METHODS.get(checkout_request.shipping_method, SHIPPING_METHODS["standard"])["price"]
    
    # Calculate final total
    total = subtotal - discount_amount + shipping_cost
    total = max(total, 0.50)  # Minimum charge for Stripe
    
    # Build URLs from provided origin
    origin_url = checkout_request.origin_url.rstrip('/')
    success_url = f"{origin_url}/checkout-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/cart"
    
    # Initialize Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_req = CheckoutSessionRequest(
        amount=float(total),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "cart_session_id": checkout_request.session_id,
            "customer_email": checkout_request.shipping_info.email,
            "shipping_name": checkout_request.shipping_info.full_name,
            "subtotal": str(subtotal),
            "discount_code": checkout_request.discount_code or "",
            "discount_amount": str(discount_amount),
            "shipping_method": checkout_request.shipping_method,
            "shipping_cost": str(shipping_cost)
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_req)
    
    # Generate order number
    import random
    order_number = f"ORD-{random.randint(100000, 999999)}"
    
    # Create payment transaction record
    transaction = {
        "stripe_session_id": session.session_id,
        "cart_session_id": checkout_request.session_id,
        "order_number": order_number,
        "subtotal": subtotal,
        "discount_code": checkout_request.discount_code,
        "discount_amount": discount_amount,
        "shipping_method": checkout_request.shipping_method,
        "shipping_cost": shipping_cost,
        "total": total,
        "currency": "usd",
        "status": "pending",
        "payment_status": "initiated",
        "shipping_info": checkout_request.shipping_info.dict(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db.payment_transactions.insert_one(transaction)
    
    # Create order record
    order = {
        "order_number": order_number,
        "cart_session_id": checkout_request.session_id,
        "stripe_session_id": session.session_id,
        "items": cart.get("items", []),
        "subtotal": subtotal,
        "discount_code": checkout_request.discount_code,
        "discount_amount": discount_amount,
        "shipping_method": checkout_request.shipping_method,
        "shipping_cost": shipping_cost,
        "total": total,
        "shipping_info": checkout_request.shipping_info.dict(),
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await db.orders.insert_one(order)
    
    return {"url": session.url, "session_id": session.session_id, "order_number": order_number}

@api_router.get("/checkout/status/{stripe_session_id}")
async def get_checkout_status(stripe_session_id: str):
    """Get checkout session status"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    
    try:
        status = await stripe_checkout.get_checkout_status(stripe_session_id)
        
        # Update payment transaction
        update_data = {
            "status": status.status,
            "payment_status": status.payment_status,
            "updated_at": datetime.utcnow()
        }
        
        await db.payment_transactions.update_one(
            {"stripe_session_id": stripe_session_id},
            {"$set": update_data}
        )
        
        # If paid, update order status
        if status.payment_status == "paid":
            await db.orders.update_one(
                {"stripe_session_id": stripe_session_id},
                {"$set": {"status": "paid", "updated_at": datetime.utcnow()}}
            )
            
            # Clear the cart
            transaction = await db.payment_transactions.find_one({"stripe_session_id": stripe_session_id})
            if transaction:
                await db.carts.update_one(
                    {"session_id": transaction.get("cart_session_id")},
                    {"$set": {"items": [], "total": 0.0, "updated_at": datetime.utcnow()}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Error checking checkout status: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction and order based on webhook
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {
                    "status": "complete",
                    "payment_status": "paid",
                    "updated_at": datetime.utcnow()
                }}
            )
            
            await db.orders.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {"status": "paid", "updated_at": datetime.utcnow()}}
            )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ===================== ORDERS ENDPOINTS =====================

@api_router.get("/orders")
async def get_orders():
    """Get all orders (Admin)"""
    orders = await db.orders.find().sort("created_at", -1).to_list(100)
    return serialize_doc(orders)

@api_router.get("/orders/session/{session_id}")
async def get_orders_by_session(session_id: str):
    """Get orders by cart session ID (for user's order history)"""
    orders = await db.orders.find({"cart_session_id": session_id}).sort("created_at", -1).to_list(100)
    
    # Populate product details for each order
    for order in orders:
        if "items" in order:
            populated_items = []
            for item in order["items"]:
                try:
                    product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
                    if product:
                        populated_items.append({
                            **item,
                            "product": serialize_doc(product)
                        })
                except:
                    continue
            order["items"] = populated_items
    
    return serialize_doc(orders)

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get single order"""
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return serialize_doc(order)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ===================== SEED DATA =====================

# Discount codes
DISCOUNT_CODES = {
    "WELCOME10": {"type": "percentage", "value": 10},  # 10% off
    "SAVE20": {"type": "percentage", "value": 20},     # 20% off
    "FREE50": {"type": "fixed", "value": 50},          # $50 off
}

# Shipping methods
SHIPPING_METHODS = {
    "standard": {"name": "Standard Shipping (5-7 days)", "price": 10.0},
    "express": {"name": "Express Shipping (2-3 days)", "price": 25.0},
    "overnight": {"name": "Overnight Shipping (1 day)", "price": 50.0},
}

@api_router.get("/shipping-methods")
async def get_shipping_methods():
    """Get available shipping methods"""
    return SHIPPING_METHODS

@api_router.post("/validate-discount")
async def validate_discount(code: str):
    """Validate discount code"""
    if code.upper() in DISCOUNT_CODES:
        return {"valid": True, "discount": DISCOUNT_CODES[code.upper()]}
    return {"valid": False, "message": "Invalid discount code"}

@api_router.post("/seed")
async def seed_products():
    """Seed initial products"""
    # Check if products already exist
    count = await db.products.count_documents({})
    if count > 0:
        return {"message": "Products already seeded", "count": count}
    
    # Sample products with translations
    products = [
        {
            "name": "Urban Black Hoodie",
            "description": "Premium cotton hoodie with minimalist design. Perfect for everyday streetwear.",
            "price": 89.99,
            "category": "Hoodies",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Black", "White", "Gray"],
            "image": None,
            "translations": {
                "cs": {"name": "Městská Černá Mikina", "description": "Prémiová bavlněná mikina s minimalistickým designem. Ideální pro každodenní streetwear."},
                "es": {"name": "Sudadera Negra Urbana", "description": "Sudadera de algodón premium con diseño minimalista. Perfecta para el streetwear diario."},
                "de": {"name": "Urban Black Hoodie", "description": "Premium-Baumwoll-Hoodie mit minimalistischem Design. Perfekt für alltägliche Streetwear."}
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Essential White Tee",
            "description": "Oversized fit cotton t-shirt. Clean lines for the modern minimalist.",
            "price": 49.99,
            "category": "T-Shirts",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["White", "Black", "Cream"],
            "image": None,
            "translations": {
                "cs": {"name": "Základní Bílé Tričko", "description": "Bavlněné tričko s volným střihem. Čisté linie pro moderního minimalistu."},
                "es": {"name": "Camiseta Blanca Esencial", "description": "Camiseta de algodón de corte holgado. Líneas limpias para el minimalista moderno."},
                "de": {"name": "Essential White Tee", "description": "Oversized Baumwoll-T-Shirt. Klare Linien für den modernen Minimalisten."}
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Cargo Street Pants",
            "description": "Relaxed fit cargo pants with multiple pockets. Urban utility meets style.",
            "price": 129.99,
            "category": "Pants",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Black", "Olive", "Beige"],
            "image": None,
            "translations": {
                "cs": {"name": "Cargo Pouliční Kalhoty", "description": "Volné cargo kalhoty s více kapsami. Městská užitkovost se setkává se stylem."},
                "es": {"name": "Pantalones Cargo Urbanos", "description": "Pantalones cargo de corte relajado con múltiples bolsillos. Utilidad urbana con estilo."},
                "de": {"name": "Cargo Street Pants", "description": "Relaxed Fit Cargohose mit mehreren Taschen. Urbane Funktionalität trifft auf Stil."}
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Tech Windbreaker",
            "description": "Lightweight water-resistant jacket. Technical fabric with street aesthetic.",
            "price": 159.99,
            "category": "Jackets",
            "sizes": ["S", "M", "L", "XL"],
            "colors": ["Black", "Navy", "White"],
            "image": None,
            "translations": {
                "cs": {"name": "Tech Větrovka", "description": "Lehká voděodolná bunda. Technická látka s pouliční estetikou."},
                "es": {"name": "Cortavientos Tech", "description": "Chaqueta ligera resistente al agua. Tejido técnico con estética urbana."},
                "de": {"name": "Tech Windbreaker", "description": "Leichte wasserabweisende Jacke. Technisches Gewebe mit Street-Ästhetik."}
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Oversized Logo Hoodie",
            "description": "Statement hoodie with embroidered SIERRA 97 SX logo. Heavy cotton blend.",
            "price": 119.99,
            "category": "Hoodies",
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Black", "Gray", "Cream"],
            "image": None,
            "translations": {
                "cs": {"name": "Oversized Logo Mikina", "description": "Výrazná mikina s vyšitým logem SIERRA 97 SX. Těžká bavlněná směs."},
                "es": {"name": "Sudadera Logo Oversize", "description": "Sudadera llamativa con logo SIERRA 97 SX bordado. Mezcla de algodón pesado."},
                "de": {"name": "Oversized Logo Hoodie", "description": "Statement-Hoodie mit gesticktem SIERRA 97 SX Logo. Schwere Baumwollmischung."}
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "name": "Slim Fit Black Jeans",
            "description": "Classic slim fit denim in pure black. Stretch comfort with timeless style.",
            "price": 99.99,
            "category": "Pants",
            "sizes": ["28", "30", "32", "34", "36"],
            "colors": ["Black", "Washed Black"],
            "image": None,
            "translations": {
                "cs": {"name": "Slim Fit Černé Džíny", "description": "Klasické džíny slim fit v čisté černé. Strečový komfort s nadčasovým stylem."},
                "es": {"name": "Jeans Negros Slim Fit", "description": "Denim clásico slim fit en negro puro. Comodidad elástica con estilo atemporal."},
                "de": {"name": "Slim Fit Black Jeans", "description": "Klassische Slim-Fit-Jeans in Reinschwarz. Stretch-Komfort mit zeitlosem Stil."}
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    result = await db.products.insert_many(products)
    return {"message": "Products seeded successfully", "count": len(result.inserted_ids)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
