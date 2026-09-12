import { getDb } from "@rxflow/shared-db";
console.log(getDb().prepare("SELECT COUNT(*) as n FROM audit_log").get());
