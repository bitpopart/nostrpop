# Lightning Payment Troubleshooting Guide

## 🚨 **Issue: Payments to bitpopart@getalby.com Not Arriving**

If Lightning payments to `bitpopart@getalby.com` are not arriving, follow this troubleshooting guide to identify and resolve the issue.

## 🔍 **Diagnostic Tools**

### **1. Lightning Address Debugger**
- **Location**: Shop → Product Management → Debug tab
- **Purpose**: Test LNURL endpoint connectivity and invoice generation
- **What it checks**:
  - Lightning address resolution to LNURL endpoint
  - LNURL-pay response validation
  - Invoice generation from callback URL
  - Payment request format verification

### **2. Browser Console Logs**
Open browser developer tools (F12) and check the Console tab for detailed logs:
- LNURL endpoint resolution
- HTTP response status codes
- JSON parsing results
- Error messages

## 🔧 **Common Issues & Solutions**

### **Issue 1: LNURL Endpoint Not Responding**
**Symptoms:**
- Debug tool shows HTTP 404 or 500 errors
- "Failed to fetch LNURL data" error messages

**Possible Causes:**
- Lightning address doesn't exist
- GetAlby service is down
- Network connectivity issues

**Solutions:**
1. **Verify Lightning Address**: Confirm `bitpopart@getalby.com` is correct
2. **Test Manually**: Visit `https://getalby.com/.well-known/lnurlp/bitpopart` in browser
3. **Check GetAlby Status**: Verify GetAlby service is operational
4. **Try Different Network**: Test from different internet connection

### **Issue 2: Invalid LNURL Response**
**Symptoms:**
- "Invalid LNURL response" error
- Missing required fields in response

**Possible Causes:**
- Lightning address not properly configured
- LNURL service returning incorrect data

**Solutions:**
1. **Check Response Format**: Use debug tool to inspect raw response
2. **Verify Required Fields**: Ensure response contains `tag`, `callback`, `minSendable`, `maxSendable`
3. **Contact GetAlby Support**: If response format is incorrect

### **Issue 3: Invoice Generation Fails**
**Symptoms:**
- LNURL endpoint works but invoice creation fails
- "Failed to request invoice" errors

**Possible Causes:**
- Amount outside allowed limits
- Callback URL issues
- GetAlby service problems

**Solutions:**
1. **Check Amount Limits**: Ensure payment amount is within min/max range
2. **Test Callback URL**: Verify callback URL is accessible
3. **Try Different Amount**: Test with various amounts (e.g., 1000 sats)

### **Issue 4: Valid Invoice But Payment Not Received**
**Symptoms:**
- Invoice generates successfully
- Payment appears to complete in wallet
- Funds don't arrive at destination

**Possible Causes:**
- Lightning routing issues
- GetAlby wallet problems
- Payment still processing

**Solutions:**
1. **Check Payment Status**: Look for payment confirmation in wallet
2. **Wait for Settlement**: Lightning payments can take a few seconds
3. **Verify Destination**: Confirm payment went to correct Lightning address
4. **Check GetAlby Wallet**: Log into GetAlby to verify receipt

## 🛠 **Step-by-Step Debugging Process**

### **Step 1: Test Lightning Address Resolution**
1. Go to Shop → Product Management → Debug tab
2. Click "Test Lightning Address"
3. Check for successful connection and valid LNURL data
4. Note any error messages

### **Step 2: Verify LNURL Response**
Expected response should include:
```json
{
  "tag": "payRequest",
  "callback": "https://...",
  "minSendable": 1000,
  "maxSendable": 11000000000,
  "metadata": "...",
  "allowsNostr": true
}
```

### **Step 3: Test Invoice Generation**
1. Click "Generate Test Invoice (1000 sats)"
2. Verify invoice is created successfully
3. Check that invoice string starts with "lnbc"
4. Note any generation errors

### **Step 4: Test Payment Flow**
1. Copy generated invoice to Lightning wallet
2. Complete payment in wallet
3. Check for payment confirmation
4. Verify funds arrive at GetAlby wallet

### **Step 5: Check Browser Console**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for detailed error messages
4. Check network requests in Network tab

## 📋 **Information to Collect**

When reporting issues, please provide:

### **Technical Details**
- Browser and version
- Operating system
- Network connection type
- Lightning wallet used

### **Error Messages**
- Exact error text from debug tool
- Browser console error messages
- Network request failures

### **LNURL Response Data**
- Raw LNURL endpoint response
- Callback URL and parameters
- Invoice generation response

### **Payment Details**
- Amount attempted
- Invoice string generated
- Wallet payment confirmation
- Transaction ID (if available)

## 🔄 **Alternative Testing Methods**

### **Manual LNURL Testing**
1. **Visit LNURL Endpoint**: `https://getalby.com/.well-known/lnurlp/bitpopart`
2. **Check Response**: Should return valid JSON with `tag: "payRequest"`
3. **Test Callback**: Use callback URL with amount parameter

### **External LNURL Tools**
- **LNURL Decoder**: Use online tools to decode and test LNURL
- **Lightning Network Explorers**: Check payment routing
- **GetAlby Dashboard**: Monitor incoming payments

### **Wallet Testing**
1. **Try Different Wallets**: Test with multiple Lightning wallets
2. **Check Wallet Logs**: Look for payment error messages
3. **Test Small Amounts**: Start with minimum payment amounts

## 🎯 **Expected Behavior**

### **Successful Flow**
1. ✅ Lightning address resolves to LNURL endpoint
2. ✅ LNURL returns valid pay request data
3. ✅ Invoice generation succeeds with valid payment request
4. ✅ Payment completes in Lightning wallet
5. ✅ Funds arrive at `bitpopart@getalby.com`

### **Timing Expectations**
- **LNURL Resolution**: < 2 seconds
- **Invoice Generation**: < 5 seconds
- **Payment Processing**: < 30 seconds
- **Fund Settlement**: < 60 seconds

## 🆘 **Getting Help**

### **Internal Support**
1. Use the Debug tab for detailed diagnostics
2. Check browser console for technical details
3. Test with different amounts and wallets

### **External Support**
1. **GetAlby Support**: For Lightning address issues
2. **Lightning Network Community**: For routing problems
3. **Wallet Support**: For wallet-specific issues

### **Documentation**
- [LNURL Specification](https://github.com/lnurl/luds)
- [GetAlby Documentation](https://getalby.com/developer)
- [Lightning Network Resources](https://lightning.network/)

---

**Use the Debug tab in the admin panel to start troubleshooting. It provides real-time testing of the Lightning payment integration and detailed error reporting.** ⚡