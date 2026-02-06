# Amplemarket Webhook Test Commands

## Webhook URL

**Development:**
```
https://3000-iq60jfh95xqkcmuejhv8s-d3f4338c.us1.manus.computer/api/webhooks/amplemarket
```

**Production:**
```
https://1twentyinternal.com/api/webhooks/amplemarket
```

---

## Test Payloads

### 1. Reply Webhook (Sequence Reply Event)

```bash
curl -X POST https://1twentyinternal.com/api/webhooks/amplemarket \
  -H "Content-Type: application/json" \
  -d '{
    "is_reply": true,
    "from": "john.doe@example.com",
    "to": "sales@1twenty.com",
    "date": "2026-02-06T12:00:00Z",
    "subject": "Re: Your proposal",
    "body": "Thanks for reaching out! I am interested in learning more about your services.",
    "id": "reply_12345",
    "labels": ["interested"],
    "dynamic_fields": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "company": "Acme Corp"
    },
    "user": {
      "id": "user_789",
      "email": "sales@1twenty.com"
    },
    "sequence": {
      "id": "seq_456",
      "name": "Outbound Sales Sequence"
    },
    "sequence_stage": {
      "id": "stage_123",
      "name": "Follow-up Email 2"
    },
    "sequence_lead": {
      "id": "lead_321",
      "email": "john.doe@example.com"
    },
    "contact": {
      "id": "contact_654"
    }
  }'
```

### 2. Sequence Stage Webhook (Email Sent)

```bash
curl -X POST https://1twentyinternal.com/api/webhooks/amplemarket \
  -H "Content-Type: application/json" \
  -d '{
    "id": "activity_98765",
    "sequence_stage": {
      "type": "email",
      "id": "stage_456",
      "name": "Initial Outreach"
    },
    "date": "2026-02-06T11:30:00Z",
    "subject": "Quick question about your sales process",
    "body": "Hi Jane, I noticed your company is growing fast...",
    "lead": {
      "id": "lead_789",
      "email": "jane.smith@example.com",
      "name": "Jane Smith"
    },
    "sequence": {
      "id": "seq_789",
      "name": "Enterprise Outreach"
    },
    "user": {
      "id": "user_123",
      "email": "sales@1twenty.com"
    },
    "contact": {
      "id": "contact_987"
    }
  }'
```

### 3. Sequence Stage Webhook (LinkedIn Connect)

```bash
curl -X POST https://1twentyinternal.com/api/webhooks/amplemarket \
  -H "Content-Type: application/json" \
  -d '{
    "id": "activity_55555",
    "sequence_stage": {
      "type": "linkedin_connect",
      "id": "stage_789",
      "name": "LinkedIn Connection Request"
    },
    "date": "2026-02-06T10:00:00Z",
    "linkedin_url": "https://linkedin.com/in/bobwilson",
    "dynamic_fields": {
      "name": "Bob Wilson",
      "email": "bob.wilson@example.com",
      "title": "VP of Sales"
    },
    "sequence": {
      "id": "seq_111",
      "name": "LinkedIn Outreach"
    },
    "contact": {
      "id": "contact_222"
    }
  }'
```

### 4. Workflow Send JSON Webhook (Reply Classification)

```bash
curl -X POST https://1twentyinternal.com/api/webhooks/amplemarket \
  -H "Content-Type: application/json" \
  -d '{
    "email_message": {
      "id": "msg_33333",
      "from": "sarah.jones@example.com",
      "subject": "Re: Partnership opportunity",
      "body": "This sounds interesting. Can you send me more details?",
      "tag": ["interested", "asked_to_circle_back_later"]
    },
    "sequence": {
      "id": "seq_222",
      "name": "Partnership Outreach"
    },
    "sequence_stage": {
      "id": "stage_333",
      "name": "Follow-up 1"
    },
    "user": {
      "id": "user_444",
      "email": "partnerships@1twenty.com"
    },
    "lead": {
      "id": "lead_555",
      "email": "sarah.jones@example.com",
      "name": "Sarah Jones",
      "company": "TechStart Inc"
    }
  }'
```

### 5. Workflow Send JSON Webhook (Not Interested)

```bash
curl -X POST https://1twentyinternal.com/api/webhooks/amplemarket \
  -H "Content-Type: application/json" \
  -d '{
    "email_message": {
      "id": "msg_77777",
      "from": "mike.brown@example.com",
      "subject": "Re: Sales inquiry",
      "body": "Not interested at this time. Please remove me from your list.",
      "tag": ["not_interested", "hard_no"]
    },
    "lead": {
      "email": "mike.brown@example.com",
      "name": "Mike Brown"
    },
    "sequence": {
      "id": "seq_888"
    }
  }'
```

### 6. Workflow Send JSON Webhook (Forwarded to Right Person)

```bash
curl -X POST https://1twentyinternal.com/api/webhooks/amplemarket \
  -H "Content-Type: application/json" \
  -d '{
    "email_message": {
      "id": "msg_99999",
      "from": "assistant@example.com",
      "subject": "Fwd: Your proposal",
      "body": "Forwarding to our procurement team for review.",
      "tag": ["forwarded_to_the_right_person"]
    },
    "lead": {
      "email": "procurement@example.com",
      "name": "Procurement Team"
    },
    "sequence": {
      "id": "seq_999"
    }
  }'
```

---

## Expected Behavior

1. **Webhook receives payload** → Returns `200 OK` immediately with `{ "received": true }`
2. **Event logged to database** → `webhookEvents` table stores raw payload
3. **Contact upserted** → Creates or updates contact in `people` table
4. **Activity created** → Adds activity record in `activities` table
5. **Status updated** → Maps labels/tags to CRM status (interested → qualified, hard_no → disqualified, etc.)
6. **Async processing** → All database operations happen after 200 response

---

## Debugging

Check webhook events in the database:

```sql
SELECT * FROM webhookEvents ORDER BY createdAt DESC LIMIT 10;
```

Check created contacts:

```sql
SELECT id, fullName, primaryEmail, status, createdAt 
FROM people 
WHERE primaryEmail LIKE '%@example.com' 
ORDER BY createdAt DESC;
```

Check created activities:

```sql
SELECT id, activityType, title, timestamp 
FROM activities 
ORDER BY timestamp DESC 
LIMIT 10;
```
