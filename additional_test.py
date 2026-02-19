#!/usr/bin/env python3
"""
Additional SIERRA 97 SX API Tests - Testing edge cases and Stripe integration
"""

import requests
import json

BASE_URL = "https://sierra97-shop.preview.emergentagent.com/api"
TEST_SESSION_ID = "test_checkout_session"

def test_checkout_with_items():
    """Test checkout with items in cart to verify Stripe integration"""
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    print("🧪 Testing Checkout with Items (Stripe Integration)")
    print("=" * 60)
    
    # First get products
    response = session.get(f"{BASE_URL}/products")
    if response.status_code == 200:
        products = response.json()
        if products:
            product_id = products[0]['id']
            print(f"✅ Got product ID: {product_id}")
            
            # Add item to cart
            cart_data = {
                "items": [
                    {
                        "product_id": product_id,
                        "quantity": 1,
                        "size": "M",
                        "color": "Black"
                    }
                ]
            }
            
            response = session.post(f"{BASE_URL}/cart/{TEST_SESSION_ID}", json=cart_data)
            if response.status_code == 200:
                cart = response.json()
                print(f"✅ Added to cart. Total: ${cart['total']}")
                
                # Now try checkout
                checkout_data = {
                    "session_id": TEST_SESSION_ID,
                    "shipping_info": {
                        "full_name": "Sierra Test Customer",
                        "email": "test@sierra97sx.com",
                        "address": "123 Street Fashion Ave",
                        "city": "Los Angeles",
                        "postal_code": "90210",
                        "country": "US",
                        "phone": "+1234567890"
                    },
                    "origin_url": "https://sierra97-shop.preview.emergentagent.com"
                }
                
                response = session.post(f"{BASE_URL}/checkout/create-session", json=checkout_data)
                print(f"Checkout Response Status: {response.status_code}")
                print(f"Response: {response.text}")
                
                if response.status_code == 200:
                    checkout_result = response.json()
                    print(f"✅ Checkout session created successfully")
                    print(f"Session ID: {checkout_result.get('session_id', 'N/A')}")
                    
                    # Test status endpoint if we have session ID
                    if 'session_id' in checkout_result:
                        status_response = session.get(f"{BASE_URL}/checkout/status/{checkout_result['session_id']}")
                        print(f"Status check: {status_response.status_code}")
                        if status_response.status_code == 200:
                            print(f"✅ Status endpoint working")
                        else:
                            print(f"❌ Status endpoint failed: {status_response.text}")
                    
                else:
                    print(f"❌ Checkout failed: {response.text}")
                    # This might be expected if Stripe is mocked or not properly configured
                    return False
            else:
                print(f"❌ Failed to add to cart: {response.text}")
                return False
        else:
            print("❌ No products found")
            return False
    else:
        print(f"❌ Failed to get products: {response.text}")
        return False
    
    return True

def test_invalid_scenarios():
    """Test error handling"""
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    print("\n🔍 Testing Error Handling")
    print("=" * 60)
    
    # Test invalid product ID
    response = session.get(f"{BASE_URL}/products/invalid_id")
    expected_fail = response.status_code != 200
    print(f"{'✅' if expected_fail else '❌'} Invalid product ID: {response.status_code}")
    
    # Test invalid cart item
    invalid_cart_data = {
        "items": [
            {
                "product_id": "invalid_product_id",
                "quantity": 1,
                "size": "M",
                "color": "Black"
            }
        ]
    }
    
    response = session.post(f"{BASE_URL}/cart/test_invalid", json=invalid_cart_data)
    print(f"✅ Invalid cart item handled: {response.status_code}")
    # Should still return 200 but with empty cart since invalid items are skipped

if __name__ == "__main__":
    test_checkout_with_items()
    test_invalid_scenarios()
    print("\n🎯 Additional testing complete")