#!/usr/bin/env python3
"""
SIERRA 97 SX E-commerce API Testing Suite
Tests all backend API endpoints for the e-commerce application.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://sierra97-shop.preview.emergentagent.com/api"
TEST_SESSION_ID = "test_session_123"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'test_details': []
        }
        
    def log_test(self, test_name, success, details="", error=""):
        """Log test result"""
        self.results['total_tests'] += 1
        if success:
            self.results['passed'] += 1
            status = "✅ PASS"
        else:
            self.results['failed'] += 1
            status = "❌ FAIL"
            
        self.results['test_details'].append({
            'test': test_name,
            'status': status,
            'details': details,
            'error': error
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
    
    def test_root_endpoint(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.json()}"
            self.log_test("API Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("API Root Endpoint", False, error=str(e))
            return False
    
    def test_get_products(self):
        """Test GET /api/products"""
        try:
            response = self.session.get(f"{BASE_URL}/products")
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Products count: {len(data) if isinstance(data, list) else 'N/A'}"
            self.log_test("GET Products List", success, details)
            return success, data
        except Exception as e:
            self.log_test("GET Products List", False, error=str(e))
            return False, []
    
    def test_get_single_product(self, product_id):
        """Test GET /api/products/{id}"""
        try:
            response = self.session.get(f"{BASE_URL}/products/{product_id}")
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Product: {data.get('name', 'N/A')}"
            self.log_test("GET Single Product", success, details)
            return success, data
        except Exception as e:
            self.log_test("GET Single Product", False, error=str(e))
            return False, {}
    
    def test_create_product(self):
        """Test POST /api/products"""
        product_data = {
            "name": "Test SIERRA Product",
            "description": "Premium test product for SIERRA 97 SX collection",
            "price": 99.99,
            "category": "T-Shirts",
            "sizes": ["S", "M", "L"],
            "colors": ["Black"]
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/products", json=product_data)
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Created ID: {data.get('id', 'N/A')}"
            self.log_test("POST Create Product", success, details)
            return success, data.get('id') if success else None
        except Exception as e:
            self.log_test("POST Create Product", False, error=str(e))
            return False, None
    
    def test_update_product(self, product_id):
        """Test PUT /api/products/{id}"""
        update_data = {
            "name": "Updated SIERRA Test Product",
            "price": 149.99
        }
        
        try:
            response = self.session.put(f"{BASE_URL}/products/{product_id}", json=update_data)
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Updated name: {data.get('name', 'N/A')}"
            self.log_test("PUT Update Product", success, details)
            return success
        except Exception as e:
            self.log_test("PUT Update Product", False, error=str(e))
            return False
    
    def test_delete_product(self, product_id):
        """Test DELETE /api/products/{id}"""
        try:
            response = self.session.delete(f"{BASE_URL}/products/{product_id}")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            self.log_test("DELETE Product", success, details)
            return success
        except Exception as e:
            self.log_test("DELETE Product", False, error=str(e))
            return False
    
    def test_get_cart(self):
        """Test GET /api/cart/{session_id}"""
        try:
            response = self.session.get(f"{BASE_URL}/cart/{TEST_SESSION_ID}")
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Items count: {len(data.get('items', []))}"
            self.log_test("GET Cart", success, details)
            return success, data
        except Exception as e:
            self.log_test("GET Cart", False, error=str(e))
            return False, {}
    
    def test_add_to_cart(self, product_id):
        """Test POST /api/cart/{session_id}"""
        cart_data = {
            "items": [
                {
                    "product_id": product_id,
                    "quantity": 2,
                    "size": "M",
                    "color": "Black"
                }
            ]
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/cart/{TEST_SESSION_ID}", json=cart_data)
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Cart total: ${data.get('total', 0)}"
            self.log_test("POST Add to Cart", success, details)
            return success, data
        except Exception as e:
            self.log_test("POST Add to Cart", False, error=str(e))
            return False, {}
    
    def test_clear_cart(self):
        """Test DELETE /api/cart/{session_id}"""
        try:
            response = self.session.delete(f"{BASE_URL}/cart/{TEST_SESSION_ID}")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            self.log_test("DELETE Clear Cart", success, details)
            return success
        except Exception as e:
            self.log_test("DELETE Clear Cart", False, error=str(e))
            return False
    
    def test_checkout_empty_cart(self):
        """Test POST /api/checkout/create-session with empty cart"""
        checkout_data = {
            "session_id": "empty_cart_session",
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
        
        try:
            response = self.session.post(f"{BASE_URL}/checkout/create-session", json=checkout_data)
            # Should return 400 for empty cart
            success = response.status_code == 400
            details = f"Status: {response.status_code} (Expected 400 for empty cart)"
            self.log_test("POST Checkout Empty Cart", success, details)
            return success
        except Exception as e:
            self.log_test("POST Checkout Empty Cart", False, error=str(e))
            return False
    
    def test_seed_products(self):
        """Test POST /api/seed"""
        try:
            response = self.session.post(f"{BASE_URL}/seed")
            success = response.status_code == 200
            data = response.json() if success else {}
            details = f"Status: {response.status_code}, Message: {data.get('message', 'N/A')}"
            self.log_test("POST Seed Products", success, details)
            return success
        except Exception as e:
            self.log_test("POST Seed Products", False, error=str(e))
            return False
    
    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print(f"\n🚀 Starting SIERRA 97 SX API Test Suite")
        print(f"Base URL: {BASE_URL}")
        print(f"Test Session ID: {TEST_SESSION_ID}")
        print("=" * 60)
        
        # Test API root
        self.test_root_endpoint()
        
        # Seed products first
        self.test_seed_products()
        
        # Test Products API
        print("\n📦 Testing Products API...")
        products_success, products = self.test_get_products()
        
        # Get a product ID for further testing
        product_id = None
        if products_success and products:
            product_id = products[0].get('id')
            if product_id:
                self.test_get_single_product(product_id)
        
        # Test product CRUD operations
        create_success, created_product_id = self.test_create_product()
        if create_success and created_product_id:
            self.test_update_product(created_product_id)
            self.test_delete_product(created_product_id)
        
        # Test Cart API
        print("\n🛒 Testing Cart API...")
        self.test_get_cart()
        
        # Add to cart if we have a product
        if product_id:
            cart_success, cart_data = self.test_add_to_cart(product_id)
        
        self.test_clear_cart()
        
        # Test Checkout API
        print("\n💳 Testing Checkout API...")
        self.test_checkout_empty_cart()
        
        # Final results
        print("\n" + "=" * 60)
        print("🎯 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"Passed: {self.results['passed']} ✅")
        print(f"Failed: {self.results['failed']} ❌")
        print(f"Success Rate: {(self.results['passed']/self.results['total_tests']*100):.1f}%")
        
        if self.results['failed'] > 0:
            print("\n❌ FAILED TESTS:")
            for test in self.results['test_details']:
                if "FAIL" in test['status']:
                    print(f"  - {test['test']}: {test['error']}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)