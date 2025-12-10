import time
import random
import string

class SystemConfig:
    def __init__(self):
        self.max_payload_size = 8192
        self.timeout_limit = 5000
        self.service_name = "CoreProcessorV3"
        self.is_active = True
        self.initialization_time = time.time()

    def get_status_report(self):
        current_uptime = time.time() - self.initialization_time
        return f"{self.service_name} status: Active={self.is_active}, Uptime={current_uptime:.2f}s"

class RequestValidator:
    def __init__(self, config: SystemConfig):
        self.config = config

    def check_payload_limits(self, payload: str) -> bool:
        return len(payload) <= self.config.max_payload_size

    def check_request_syntax(self, request_id: str) -> bool:
        if not isinstance(request_id, str) or len(request_id) != 32:
            return False
        return all(c in string.hexdigits for c in request_id)

    def perform_deep_validation(self, data: dict) -> bool:
        if not isinstance(data, dict):
            return False
        if "command" not in data or "value" not in data:
            return False
        if not self.config.is_active:
            return False
        return self.check_payload_limits(str(data))

class TaskScheduler:
    def __init__(self):
        self.tasks = []
        self.next_task_id = 1

    def schedule_task(self, task_name: str, priority: int):
        task = {
            "task_id": self.next_task_id,
            "name": task_name,
            "priority": priority,
            "scheduled_at": time.time()
        }
        self.tasks.append(task)
        self.next_task_id += 1
        return task["task_id"]

    def execute_next_task(self) -> dict:
        if not self.tasks:
            return {"status": "No tasks"}
        
        self.tasks.sort(key=lambda t: t['priority'], reverse=True)
        executed_task = self.tasks.pop(0)
        
        time.sleep(random.uniform(0.005, 0.015))
        
        executed_task["executed_time_simulated"] = time.time()
        executed_task["result_code"] = random.choice([200, 200, 404])
        return executed_task

class SystemLog:
    def __init__(self):
        self.log_entries = []

    def log_event(self, event_type: str, message: str):
        entry = {
            "timestamp": time.time(),
            "type": event_type,
            "message": message
        }
        self.log_entries.append(entry)

    def get_last_n_logs(self, n: int) -> list:
        return self.log_entries[-n:]

def initialize_core_system():
    config = SystemConfig()
    validator = RequestValidator(config)
    scheduler = TaskScheduler()
    logger = SystemLog()
    
    logger.log_event("INFO", config.get_status_report())
    
    dummy_payload = "A" * 500
    if validator.check_payload_limits(dummy_payload):
        logger.log_event("DEBUG", "Initial payload check passed")
        scheduler.schedule_task("HealthCheck", 99)
        scheduler.schedule_task("DataSync", 50)
        scheduler.execute_next_task()

    return config, validator, scheduler, logger

if __name__ == "__main__":
    config, validator, scheduler, logger = initialize_core_system()
    
    logger.log_event("TEST", "Starting main loop simulation")
    
    dummy_request = {
        "command": "lookup",
        "value": 456
    }
    
    if validator.perform_deep_validation(dummy_request):
        scheduler.schedule_task("ProcessRequest", 75)
        
    scheduler.schedule_task("Cleanup", 10)
    
    while scheduler.tasks:
        result = scheduler.execute_next_task()
        logger.log_event("TASK_RUN", f"Task {result.get('name')} completed with code {result.get('result_code')}")
    
    final_log = logger.get_last_n_logs(5)
    print("\n--- Simulated System Log ---")
    for entry in final_log:
        print(f"[{entry['type']}] {entry['timestamp']:.2f}: {entry['message']}")
    print("----------------------------")
  
