#!/usr/bin/env python3
"""
Test client for DIG Products MCP Server
Spawns scripts/dig_products_mcp.py, sends JSON-RPC requests, and validates responses.
"""

import sys
import os
import json
import subprocess

def run_test():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    python_bin = os.path.join(base_dir, 'shop', '.venv', 'bin', 'python')
    mcp_script = os.path.join(base_dir, 'scripts', 'dig_products_mcp.py')
    
    print(f"[TEST] Spawning MCP server: {python_bin} {mcp_script}")
    proc = subprocess.Popen(
        [python_bin, mcp_script],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    req_id = 1
    def send_req(method, params=None):
        nonlocal req_id
        payload = {"jsonrpc": "2.0", "id": req_id, "method": method}
        if params is not None:
            payload["params"] = params
        line = json.dumps(payload) + "\n"
        proc.stdin.write(line)
        proc.stdin.flush()
        resp_line = proc.stdout.readline()
        req_id += 1
        return json.loads(resp_line)

    def send_notification(method, params=None):
        payload = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            payload["params"] = params
        line = json.dumps(payload) + "\n"
        proc.stdin.write(line)
        proc.stdin.flush()

    try:
        # 1. Initialize
        print("\n--- 1. Testing 'initialize' ---")
        init_res = send_req("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "test-client", "version": "1.0.0"}
        })
        print(f"Server Info: {init_res.get('result', {}).get('serverInfo')}")
        assert "serverInfo" in init_res.get("result", {}), "Missing serverInfo in initialize"

        send_notification("notifications/initialized")

        # 2. List tools
        print("\n--- 2. Testing 'tools/list' ---")
        tools_res = send_req("tools/list")
        tools = tools_res.get("result", {}).get("tools", [])
        tool_names = [t["name"] for t in tools]
        print(f"Available tools ({len(tools)}): {', '.join(tool_names)}")
        expected_tools = ["view_products", "get_product", "add_product", "delete_product", "list_categories"]
        for et in expected_tools:
            assert et in tool_names, f"Expected tool {et} not found!"

        # 3. Call list_categories
        print("\n--- 3. Testing 'list_categories' ---")
        cat_res = send_req("tools/call", {"name": "list_categories", "arguments": {}})
        assert not cat_res.get("result", {}).get("isError"), f"Tool error: {cat_res}"
        cat_data = json.loads(cat_res["result"]["content"][0]["text"])
        print(f"Found {len(cat_data['categories'])} categories:")
        for c in cat_data["categories"]:
            print(f" - [{c['id']}] {c['name']} ({len(c['subcategories'])} subcategories)")

        # 4. Call view_products
        print("\n--- 4. Testing 'view_products' ---")
        view_res = send_req("tools/call", {"name": "view_products", "arguments": {"limit": 5}})
        assert not view_res.get("result", {}).get("isError"), f"Tool error: {view_res}"
        view_data = json.loads(view_res["result"]["content"][0]["text"])
        print(f"Total matching: {view_data['total_matching']}, returned: {view_data['count']}")
        for p in view_data["products"][:3]:
            print(f" - [{p['id']}] {p['name']} (₪{p['price']})")

        # 5. Call add_product
        print("\n--- 5. Testing 'add_product' ---")
        test_prod_name = "עניבת משי רויאל אזמרגד DIG Royal Grand Emerald"
        add_res = send_req("tools/call", {
            "name": "add_product",
            "arguments": {
                "name": test_prod_name,
                "description": "עניבת משי ז'קארד איטלקית בצבע אמרלד עמוק עם עיטורי זהב 18K מיוחדת לחתנים.",
                "price": 310.0,
                "category_name": "עניבות ופפיונים",
                "sub_category_name": "עניבות משי",
                "featured": True,
                "show_in_gallery": True
            }
        })
        assert not add_res.get("result", {}).get("isError"), f"Failed to add product: {add_res}"
        add_data = json.loads(add_res["result"]["content"][0]["text"])
        created_prod = add_data["product"]
        created_id = created_prod["id"]
        print(f"Successfully added product ID {created_id}: '{created_prod['name']}' with SKU: {created_prod['sku']}")

        # 6. Call get_product
        print("\n--- 6. Testing 'get_product' ---")
        get_res = send_req("tools/call", {
            "name": "get_product",
            "arguments": {"product_id": created_id}
        })
        assert not get_res.get("result", {}).get("isError"), f"Failed to get product: {get_res}"
        got_prod = json.loads(get_res["result"]["content"][0]["text"])
        print(f"Retrieved product: ID {got_prod['id']}, Name: {got_prod['name']}, Price: ₪{got_prod['price']}")
        assert got_prod["name"] == test_prod_name

        # 7. Call delete_product
        print("\n--- 7. Testing 'delete_product' ---")
        del_res = send_req("tools/call", {
            "name": "delete_product",
            "arguments": {"product_id": created_id}
        })
        assert not del_res.get("result", {}).get("isError"), f"Failed to delete product: {del_res}"
        del_data = json.loads(del_res["result"]["content"][0]["text"])
        print(f"Delete result: {del_data['message']}")

        # 8. Verify product is gone
        print("\n--- 8. Verify deletion with 'get_product' ---")
        verify_del_res = send_req("tools/call", {
            "name": "get_product",
            "arguments": {"product_id": created_id}
        })
        assert verify_del_res.get("result", {}).get("isError") is True, "Product should not exist after deletion!"
        print(f"Confirmed deletion: {verify_del_res['result']['content'][0]['text']}")

        print("\n==========================================")
        print("ALL MCP SERVER TESTS PASSED SUCCESSFULLY!")
        print("==========================================")

    finally:
        proc.stdin.close()
        proc.terminate()
        proc.wait(timeout=2)

if __name__ == "__main__":
    run_test()
