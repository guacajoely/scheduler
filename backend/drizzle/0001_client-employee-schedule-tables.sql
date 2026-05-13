CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TABLE "client" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"requested_schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "client_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "client_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"client_id" text NOT NULL,
	"week_of" date NOT NULL,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "client_schedule_client_id_week_of_unique" UNIQUE("client_id","week_of")
);
--> statement-breakpoint
CREATE TABLE "employee" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text NOT NULL,
	"address_line_1" text NOT NULL,
	"address_line_2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"requested_schedule" "day_of_week"[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "employee_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "employee_schedule" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"employee_id" text NOT NULL,
	"week_of" date NOT NULL,
	"schedule" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "employee_schedule_employee_id_week_of_unique" UNIQUE("employee_id","week_of")
);
--> statement-breakpoint
ALTER TABLE "client_schedule" ADD CONSTRAINT "client_schedule_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_schedule" ADD CONSTRAINT "employee_schedule_employee_id_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER set_client_updated_at
BEFORE UPDATE ON "client"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_employee_updated_at
BEFORE UPDATE ON "employee"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_client_schedule_updated_at
BEFORE UPDATE ON "client_schedule"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();--> statement-breakpoint
CREATE TRIGGER set_employee_schedule_updated_at
BEFORE UPDATE ON "employee_schedule"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();