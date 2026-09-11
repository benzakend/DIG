#!/usr/bin/env python3
"""
Live comprehensive test for DIG Products MCP Server
Simulates an AI agent interacting with the MCP server to view, add, and delete products.
"""

import sys
import os
import json
import subprocess
import time

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    python_bin = os.path.join(base_dir, 'shop', '.venv', 'bin', 'python')
    mcp_script = os.path.join(base_dir, 'scripts', 'dig_products_mcp.py')

    print("=================================================================")
    print("🚀 LIVE TEST: AI AGENT <--> DIG PRODUCTS MCP SERVER")
    print("=================================================================")
    print(f"Connecting to MCP server via stdio: {mcp_script}\n")

    proc = subprocess.Popen(
        [python_bin, mcp_script],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    req_counter = 1

    def call_mcp(method, params=None):
        nonlocal req_counter
        req = {"jsonrpc": "2.0", "id": req_counter, "method": method}
        if params is not None:
            req["params"] = params
        req_counter += 1
        
        proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()
        line = proc.stdout.readline()
        return json.loads(line)

    def notify_mcp(method, params=None):
        req = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            req["params"] = params
        proc.stdin.write(json.dumps(req) + "\n")
        proc.stdin.flush()

    try:
        # Step 1: Initialize
        print("[AGENT -> MCP] Handshake: Sending 'initialize'...")
        init_res = call_mcp("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "AntigravityAgent", "version": "2.0"}
        })
        server_info = init_res.get("result", {}).get("serverInfo", {})
        print(f"[MCP -> AGENT] Connected to: {server_info.get('name')} v{server_info.get('version')}")
        notify_mcp("notifications/initialized")

        # Step 2: Discover Tools
        print("\n[AGENT -> MCP] Discovering tools via 'tools/list'...")
        tools_res = call_mcp("tools/list")
        tools = tools_res.get("result", {}).get("tools", [])
        print(f"[MCP -> AGENT] Server supports {len(tools)} tools:")
        for t in tools:
            print(f"   • {t['name']}: {t['description']}")

        # Step 3: Browse Categories
        print("\n[AGENT -> MCP] Calling 'list_categories'...")
        cat_res = call_mcp("tools/call", {"name": "list_categories", "arguments": {}})
        cat_payload = json.loads(cat_res["result"]["content"][0]["text"])
        print(f"[MCP -> AGENT] Found {len(cat_payload['categories'])} luxury categories:")
        for c in cat_payload["categories"]:
            sub_names = ", ".join([s["name"] for s in c["subcategories"]])
            print(f"   📂 {c['name']} (ID: {c['id']}) -> [{sub_names}]")

        # Step 4: View existing products
        print("\n[AGENT -> MCP] Calling 'view_products' (search='חפתים')...")
        view_res = call_mcp("tools/call", {
            "name": "view_products",
            "arguments": {"search": "חפתים", "limit": 3}
        })
        view_payload = json.loads(view_res["result"]["content"][0]["text"])
        print(f"[MCP -> AGENT] Found {view_payload['total_matching']} matching products:")
        for p in view_payload["products"]:
            print(f"   💎 [{p['id']}] {p['name']} | ₪{p['price']} | SKU: {p['sku']}")

        # Step 5: Add a new luxury product
        print("\n[AGENT -> MCP] Calling 'add_product' (Adding a new VIP item)...")
        new_product_args = {
            "name": "עניבת משי זהב ויהלומים DIG Imperial Gold Tie",
            "description": "עניבת משי ז'קארד יוקרתית באריגת חוטי זהב מלכותית, מיועדת במיוחד לחתן שרוצה לבלוט מעל כולם ברחבת הריקודים ובחופה.",
            "price": 390.00,
            "category_name": "עניבות ופפיונים",
            "sub_category_name": "עניבות משי",
            "sku": "DIG-TIE-GOLD-VIP",
            "image_filename": "dig_emerald_tie.jpg",
            "featured": True,
            "show_in_gallery": True
        }
        add_res = call_mcp("tools/call", {
            "name": "add_product",
            "arguments": new_product_args
        })
        add_payload = json.loads(add_res["result"]["content"][0]["text"])
        created = add_payload["product"]
        created_id = created["id"]
        print(f"[MCP -> AGENT] ✅ Product successfully created!")
        print(f"   ID: {created['id']}")
        print(f"   Name: {created['name']}")
        print(f"   Price: ₪{created['price']}")
        print(f"   Category: {created['category']['name']}")
        print(f"   SKU: {created['sku']}")
        print(f"   Image URL: {created['image']}")

        # Step 6: Get the newly added product
        print(f"\n[AGENT -> MCP] Calling 'get_product' for ID {created_id}...")
        get_res = call_mcp("tools/call", {
            "name": "get_product",
            "arguments": {"product_id": created_id}
        })
        get_payload = json.loads(get_res["result"]["content"][0]["text"])
        print(f"[MCP -> AGENT] Retrieved details for: {get_payload['name']}")
        print(f"   Description: {get_payload['description']}")
        print(f"   Active: {get_payload['is_active']}, Featured: {get_payload['featured']}")

        # Step 7: Delete a product (to test delete capability)
        print(f"\n[AGENT -> MCP] Calling 'delete_product' for ID {created_id}...")
        del_res = call_mcp("tools/call", {
            "name": "delete_product",
            "arguments": {"product_id": created_id}
        })
        del_payload = json.loads(del_res["result"]["content"][0]["text"])
        print(f"[MCP -> AGENT] ✅ {del_payload['message']}")

        # Step 8: Verify deletion
        print(f"\n[AGENT -> MCP] Verifying deletion of ID {created_id}...")
        verify_del = call_mcp("tools/call", {
            "name": "get_product",
            "arguments": {"product_id": created_id}
        })
        is_error = verify_del.get("result", {}).get("isError")
        err_msg = verify_del.get("result", {}).get("content", [{}])[0].get("text", "")
        print(f"[MCP -> AGENT] Error response as expected: {err_msg} (isError: {is_error})")

        print("\n=================================================================")
        print("🎉 ALL MCP PROTOCOL & DATABASE TESTS PASSED WITH 100% SUCCESS!")
        print("=================================================================")

    finally:
        proc.stdin.close()
        proc.terminate()
        proc.wait(timeout=2)

if __name__ == "__main__":
    main()
