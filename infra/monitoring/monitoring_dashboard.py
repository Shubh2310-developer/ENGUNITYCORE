#!/usr/bin/env python3
"""
Real-time Backend Performance Monitor
Displays live performance metrics and health status
"""
import asyncio
import httpx
import time
from datetime import datetime
import sys
import os
from collections import deque

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️  redis module not installed. Redis stats will be unavailable.")

class PerformanceMonitor:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.response_times = deque(maxlen=100)
        self.cache_hits = 0
        self.cache_misses = 0
        self.error_count = 0
        self.request_count = 0
        
    async def check_health(self):
        """Monitor health endpoint"""
        try:
            start = time.time()
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health", timeout=5.0)
            
            elapsed = time.time() - start
            self.response_times.append(elapsed * 1000)  # ms
            self.request_count += 1
            
            # Check cache header
            cache_status = response.headers.get("X-Cache", "N/A")
            if cache_status == "HIT":
                self.cache_hits += 1
            elif cache_status == "MISS":
                self.cache_misses += 1
            
            return True, elapsed * 1000, cache_status
        except Exception as e:
            self.error_count += 1
            return False, 0, "ERROR"
    
    async def get_redis_stats(self):
        """Get Redis statistics"""
        if not REDIS_AVAILABLE:
            return {"status": "Module not installed"}
        
        try:
            redis = await aioredis.from_url("redis://localhost:6379", socket_timeout=2)
            info = await redis.info()
            await redis.close()
            
            return {
                "status": "Connected",
                "memory_used": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "total_commands": info.get("total_commands_processed", 0),
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
            }
        except Exception as e:
            return {"status": f"Error: {str(e)[:30]}"}
    
    def get_stats(self):
        """Calculate statistics"""
        if not self.response_times:
            return {}
        
        times = list(self.response_times)
        cache_total = self.cache_hits + self.cache_misses
        cache_rate = (self.cache_hits / cache_total * 100) if cache_total > 0 else 0
        
        return {
            "avg_response_time": sum(times) / len(times),
            "min_response_time": min(times),
            "max_response_time": max(times),
            "cache_hit_rate": cache_rate,
            "error_rate": (self.error_count / self.request_count * 100) if self.request_count > 0 else 0,
        }
    
    def get_health_indicator(self, avg_time):
        """Get health status indicator"""
        if avg_time < 50:
            return "🟢 EXCELLENT"
        elif avg_time < 100:
            return "🟡 GOOD"
        elif avg_time < 200:
            return "🟠 FAIR"
        else:
            return "🔴 SLOW"
    
    async def run(self, interval=3):
        """Run monitoring loop"""
        print("🔍 Backend Performance Monitor")
        print("=" * 70)
        print(f"Monitoring: {self.base_url}")
        print("Press Ctrl+C to stop...")
        print("=" * 70)
        print()
        
        iteration = 0
        while True:
            iteration += 1
            
            # Check health
            success, response_time, cache_status = await self.check_health()
            
            # Get stats
            stats = self.get_stats()
            redis_stats = await self.get_redis_stats()
            
            # Clear screen and display dashboard
            if iteration > 1:  # Don't clear on first iteration
                print("\033[H\033[J", end="")  # Clear screen, move to top
            
            print("╔" + "═" * 68 + "╗")
            print("║" + " " * 15 + "BACKEND PERFORMANCE DASHBOARD" + " " * 24 + "║")
            print("╚" + "═" * 68 + "╝")
            print()
            print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Requests: {self.request_count}")
            print(f"🌐 Endpoint: {self.base_url}/health")
            print()
            
            # Last request info
            status_emoji = "✅" if success else "❌"
            print(f"{status_emoji} Last Request: {response_time:.2f}ms | Cache: {cache_status}")
            print()
            
            if stats:
                avg_time = stats['avg_response_time']
                health = self.get_health_indicator(avg_time)
                
                print("─" * 70)
                print(f"📊 RESPONSE TIMES (last 100 requests) | Status: {health}")
                print("─" * 70)
                print(f"   Average:  {avg_time:.2f}ms")
                print(f"   Min:      {stats['min_response_time']:.2f}ms")
                print(f"   Max:      {stats['max_response_time']:.2f}ms")
                print()
                
                print("─" * 70)
                print("💾 CACHE STATISTICS")
                print("─" * 70)
                cache_rate = stats['cache_hit_rate']
                cache_emoji = "🟢" if cache_rate > 70 else "🟡" if cache_rate > 40 else "🔴"
                print(f"   Hit Rate:  {cache_emoji} {cache_rate:.1f}%")
                print(f"   Hits:      {self.cache_hits}")
                print(f"   Misses:    {self.cache_misses}")
                print()
                
                print("─" * 70)
                print("❌ ERROR TRACKING")
                print("─" * 70)
                error_emoji = "🟢" if stats['error_rate'] == 0 else "🔴"
                print(f"   Total Errors:  {error_emoji} {self.error_count}")
                print(f"   Error Rate:    {stats['error_rate']:.2f}%")
                print()
            
            print("─" * 70)
            print("🔴 REDIS STATUS")
            print("─" * 70)
            for key, value in redis_stats.items():
                print(f"   {key}: {value}")
            print()
            
            print("=" * 70)
            print(f"Next check in {interval}s... (Press Ctrl+C to stop)")
            
            await asyncio.sleep(interval)

async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Backend Performance Monitor")
    parser.add_argument("--url", default="http://localhost:8001", help="Backend URL")
    parser.add_argument("--interval", type=int, default=3, help="Check interval in seconds")
    args = parser.parse_args()
    
    monitor = PerformanceMonitor(base_url=args.url)
    
    try:
        await monitor.run(interval=args.interval)
    except KeyboardInterrupt:
        print("\n\n" + "=" * 70)
        print("📊 FINAL STATISTICS")
        print("=" * 70)
        stats = monitor.get_stats()
        if stats:
            print(f"Total Requests: {monitor.request_count}")
            print(f"Average Response Time: {stats['avg_response_time']:.2f}ms")
            print(f"Cache Hit Rate: {stats['cache_hit_rate']:.1f}%")
            print(f"Error Count: {monitor.error_count}")
        print("=" * 70)
        print("\n✅ Monitoring stopped.")

if __name__ == "__main__":
    asyncio.run(main())
