# Payment System Test Cases

## Test Environment Setup
1. Ensure server is running with test environment variables
2. Set up test Pesapal sandbox credentials
3. Use test email addresses (e.g., test@example.com)

## Test Scenarios

### 1. Normal Payment Flow
**Steps:**
1. Create payment with valid plan (Spark/Foundation/Momentum/Growth)
2. Complete payment in Pesapal sandbox
3. Verify IPN is received and processed
4. Verify callback page shows correct status
5. Check transaction record is updated correctly

**Expected Results:**
- Payment created successfully
- Redirect to Pesapal works
- IPN received and marked as processed
- Transaction status: "paid"
- Email sent (placeholder implemented)
- Callback page shows "You're all set"

### 2. Invalid Plan Test
**Steps:**
1. Attempt to create payment with invalid plan ID
2. Verify error response

**Expected Results:**
- 400 error returned
- Error message lists valid plans
- No transaction created

### 3. Invalid Email Format Test
**Steps:**
1. Create payment with invalid email format
2. Verify validation error

**Expected Results:**
- 400 error returned
- Error message: "Invalid email format"
- No transaction created

### 4. Missing Contact Info Test
**Steps:**
1. Create payment without email or phone
2. Verify validation error

**Expected Results:**
- 400 error returned
- Error message: "email or phone is required"

### 5. Duplicate IPN Protection Test
**Steps:**
1. Create payment and complete it
2. Simulate duplicate IPN callback
3. Verify duplicate is detected and handled

**Expected Results:**
- First IPN processed normally
- Second IPN marked as duplicate
- Transaction status unchanged
- Returns 200 with duplicate: true

### 6. Cancelled Payment Test
**Steps:**
1. Create payment
2. Cancel payment in Pesapal sandbox
3. Verify cancellation handling

**Expected Results:**
- Transaction status: "cancelled"
- Cancelled page displayed correctly
- Admin notification sent

### 7. Failed Payment Test
**Steps:**
1. Create payment
2. Simulate failed payment in Pesapal
3. Verify failure handling

**Expected Results:**
- Transaction status: "failed"
- Admin notification sent
- Appropriate error handling

### 8. Callback Without Reference Test
**Steps:**
1. Access callback page without OrderMerchantReference
2. Verify graceful handling

**Expected Results:**
- Appropriate error message displayed
- No transaction update attempted

### 9. IPN Without Required Fields Test
**Steps:**
1. Send IPN without OrderTrackingId or OrderMerchantReference
2. Verify error handling

**Expected Results:**
- 400 error returned
- Appropriate error message
- No transaction corruption

### 10. Transaction Reconciliation Test
**Steps:**
1. Create multiple payments with different statuses
2. Use admin endpoint to retrieve all transactions
3. Verify transaction data integrity

**Expected Results:**
- All transactions accessible via admin endpoint
- Data fields match expected structure
- Timestamps are correct
- Status transitions are accurate

### 11. Email Failure Handling Test
**Steps:**
1. Complete a payment
2. Simulate email service failure
3. Verify payment still succeeds despite email failure

**Expected Results:**
- Transaction marked as paid
- Email failure logged in transaction record
- Payment completion not blocked by email failure
- Admin notification of email failure

### 12. Server Configuration Test
**Steps:**
1. Test without PESAPAL_NOTIFICATION_ID set
2. Verify appropriate error message

**Expected Results:**
- 500 error with clear configuration message
- No payment creation attempted
- Guidance to run /api/register-ipn

## Admin Endpoints Testing

### Transaction Lookup
- GET `/api/transaction/:merchantReference`
- Test with valid reference
- Test with invalid reference
- Verify only safe data is returned

### Transaction List
- GET `/api/admin/transactions?key=SETUP_KEY`
- Test with valid key
- Test with invalid key
- Verify all transactions returned

### Status Test
- GET `/api/admin/test-status?key=SETUP_KEY&orderTrackingId=XXX`
- Test with valid tracking ID
- Test with invalid tracking ID
- Verify Pesapal status lookup

## Security Testing

### Signature Validation
- Test signature generation and validation
- Test with invalid signatures
- Test with missing signatures

### Rate Limiting
- Test multiple rapid payment creations
- Verify appropriate rate limiting (if implemented)

### Data Validation
- Test with malicious payloads
- Test with SQL injection attempts
- Test with XSS attempts

## Performance Testing

### Concurrent Payments
- Simulate multiple simultaneous payment creations
- Verify transaction integrity
- Check for race conditions

### High Load Scenarios
- Test with rapid IPN callbacks
- Verify server stability
- Check memory usage

## Integration Testing

### Pesapal Sandbox
- Test full flow with Pesapal sandbox
- Verify all Pesapal API calls work correctly
- Test timeout handling

### Email Service Integration
- Test with actual email service (when configured)
- Verify email templates
- Test bounce handling

## Regression Testing

### Previous Bug Fixes
- Re-test issues that were previously fixed
- Verify they remain fixed

### Edge Cases
- Test with very long merchant references
- Test with special characters in data
- Test with boundary values (amounts, etc.)

## Monitoring and Logging

### Log Verification
- Check all payment flows generate appropriate logs
- Verify error logging is comprehensive
- Check sensitive data is not logged

### Metrics Collection
- Verify payment success rate tracking
- Check error rate monitoring
- Validate performance metrics

## Test Data Cleanup

### Test Transaction Cleanup
- Provide method to clear test transactions
- Verify cleanup doesn't affect production data
- Test cleanup before production deployment

## Manual Testing Checklist

Before Production Deployment:
- [ ] All test scenarios pass
- [ ] Admin endpoints work correctly
- [ ] Email integration tested (if configured)
- [ ] Pesapal production credentials tested
- [ ] Error handling verified
- [ ] Logging checked
- [ ] Performance acceptable
- [ ] Security review completed
- [ ] Backup procedures verified
- [ ] Rollback plan tested