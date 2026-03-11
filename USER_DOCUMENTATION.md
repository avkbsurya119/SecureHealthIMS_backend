# SecureHealthIMS User Guide

## Complete User Manual

| Document Metadata | |
|-------------------|-----------------|
| **Project** | SecureHealthIMS (CuraLink) |
| **Version** | 1.0.0 |
| **Date** | March 11, 2026 |
| **Classification** | User Guide |
| **Application URL** | https://secure-health-ims-frontend.vercel.app |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Patient Guide](#3-patient-guide)
4. [Doctor Guide](#4-doctor-guide)
5. [Admin Guide](#5-admin-guide)
6. [AI Chatbot](#6-ai-chatbot)
7. [Privacy & Consent](#7-privacy--consent)
8. [Troubleshooting](#8-troubleshooting)
9. [FAQ](#9-faq)

---

## 1. Introduction

### 1.1 What is SecureHealthIMS?

SecureHealthIMS (branded as **CuraLink**) is a comprehensive healthcare information management system that enables:

- **Patients** to manage their health records, appointments, and privacy settings
- **Doctors** to manage patient visits, prescriptions, and appointments
- **Administrators** to oversee user management and system security

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| Secure Authentication | Two-factor registration with OTP verification |
| Role-Based Access | Different dashboards for patients, doctors, and admins |
| Consent Management | Full control over who can access your medical data |
| Appointment Booking | Schedule and manage appointments with doctors |
| AI Assistant | Multilingual chatbot for navigation and information |
| Audit Trail | See exactly who has accessed your medical records |

### 1.3 Supported Browsers

| Browser | Minimum Version |
|---------|-----------------|
| Google Chrome | 90+ |
| Mozilla Firefox | 88+ |
| Microsoft Edge | 90+ |
| Safari | 14+ |

---

## 2. Getting Started

### 2.1 Creating an Account

#### Step 1: Visit the Registration Page

Navigate to the application and click **"Register now"** or **"Get Started"**.

#### Step 2: Choose Your Role

Select your account type:
- **Patient**: For individuals seeking healthcare services
- **Doctor**: For medical professionals (requires admin approval)

#### Step 3: Enter Your Information

**For Patients:**
- Full Name
- Email Address
- Password (minimum 8 characters)
- Phone Number
- Date of Birth
- Gender
- Address

**For Doctors:**
- Full Name
- Email Address
- Password
- Phone Number
- Specialization
- Department ID (optional)

#### Step 4: Verify Your Email

1. Check your email inbox for a verification code
2. Enter the 8-digit code on the verification screen
3. Click **"Complete Registration"**

#### Step 5: Login

After successful registration:
- **Patients**: Can log in immediately
- **Doctors**: Must wait for admin approval before logging in

### 2.2 Logging In

1. Go to the Login page
2. Enter your email and password
3. Click **"Sign In"**
4. You'll be redirected to your role-specific dashboard

### 2.3 Logging Out

Click the logout button (red circle with exit icon) in the navigation bar.

---

## 3. Patient Guide

### 3.1 Patient Dashboard Overview

After logging in, you'll see your personalized dashboard with these sections:

| Tab | Description |
|-----|-------------|
| Overview | Quick access cards for all features |
| Medical History | View past visits and diagnoses |
| Prescriptions | View prescribed medications |
| Appointments | Manage your appointments |
| Profile | Edit your personal information |
| Privacy | Manage consent settings |
| Audit | See who accessed your data |
| Book Appointment | Schedule new appointments |

### 3.2 Viewing Medical History

1. Click the **"Medical History"** tab
2. View all your past visits including:
   - Visit date
   - Doctor name and specialization
   - Chief complaint
   - Diagnosis
   - Notes

### 3.3 Viewing Prescriptions

1. Click the **"Prescriptions"** tab
2. View all your prescriptions including:
   - Medication name
   - Dosage
   - Frequency
   - Duration
   - Special instructions
   - Prescribing doctor

### 3.4 Managing Appointments

#### Viewing Appointments

1. Click the **"Appointments"** tab
2. See all appointments with status:
   - **Pending**: Awaiting doctor confirmation
   - **Approved**: Confirmed by doctor
   - **Completed**: Visit completed
   - **Cancelled**: Appointment cancelled
   - **No Show**: Missed appointment

#### Booking a New Appointment

1. Click the **"Book Appointment"** tab
2. Select a doctor from the dropdown
3. Choose your preferred date
4. Select a time slot
5. Click **"Confirm Booking"**

### 3.5 Editing Your Profile

1. Click the **"Profile"** tab
2. Click **"Edit Details"** button
3. Update your information:
   - Blood Group
   - Date of Birth
   - Phone Number
   - Address
   - Gender
   - Allergies
   - Medical History
4. Click **"Save Changes"**

**Note:** Name and Email cannot be changed directly. Contact admin for corrections.

### 3.6 Managing Privacy & Consent

See [Section 7: Privacy & Consent](#7-privacy--consent) for detailed information.

### 3.7 Viewing Audit Logs

1. Click the **"Audit"** tab (or "Data Access Logs")
2. View who has accessed your medical information:
   - Action type (READ, CREATE, UPDATE)
   - Resource accessed
   - Who accessed it (doctor name, role, specialization)
   - Date and time

---

## 4. Doctor Guide

### 4.1 Account Activation

After registering as a doctor:

1. Your account is created with "pending" status
2. Wait for an administrator to approve your account
3. You'll be able to log in once approved
4. If you see "pending approval" message, please wait

### 4.2 Doctor Dashboard Overview

| Tab | Description |
|-----|-------------|
| Overview | Quick access to appointments and patients |
| Appointments | Manage your scheduled appointments |
| Patients | Search patients and manage records |
| Profile | Edit your professional details |

### 4.3 Managing Appointments

#### Viewing Appointments

1. Click the **"Appointments"** tab
2. See all appointments assigned to you
3. Each appointment shows:
   - Patient name
   - Date and time
   - Reason for visit
   - Current status

#### Accepting/Declining Appointments

**To Accept:**
1. Find a "Pending" appointment
2. Click **"Accept"**
3. Appointment status changes to "Confirmed"

**To Decline:**
1. Click **"Decline"**
2. Enter a reason for declining (required)
3. Click **"Confirm Decline"**

#### Marking Appointment Completion

After the appointment time has passed:
1. Click **"Patient Visited"** if the patient attended
2. Click **"No Show"** if the patient didn't attend

### 4.4 Searching for Patients

1. Click the **"Patients"** tab
2. Enter patient name, email, or phone in the search box
3. Matching patients will appear
4. Click on a patient to view their details

**Note:** Only patients who have granted consent for data sharing will appear in search results.

### 4.5 Creating Visit Records

1. Search for and select a patient
2. Click **"Record Visit"**
3. Fill in the visit details:
   - Date
   - Chief Complaint
   - Diagnosis (required)
   - Notes/Findings
4. Click **"Save Record"**

### 4.6 Creating Prescriptions

1. Search for and select a patient
2. Click **"Prescribe"**
3. Fill in prescription details:
   - Medication Name (required)
   - Dosage (required)
   - Frequency
   - Duration
   - Instructions
4. Click **"Issue Prescription"**

### 4.7 Updating Professional Profile

1. Click the **"Profile"** tab
2. Click **"Edit Professional Details"**
3. Update your information:
   - Specialization
   - License Number
   - Education/Qualifications
   - Experience (years)
   - Phone
   - Hospital Affiliation
4. Click **"Save Changes"**

---

## 5. Admin Guide

### 5.1 Admin Dashboard Overview

The admin dashboard provides:

| Section | Description |
|---------|-------------|
| Statistics | Count of verified doctors, nurses, patients |
| Doctors Tab | Manage doctor approvals and accounts |
| Patients Tab | View and manage patient accounts |
| Nurses Tab | View and manage nurse accounts |
| System Logs | View all audit logs |

### 5.2 User Management

#### Viewing All Users

1. Users are categorized into tabs: Doctors, Patients, Nurses
2. Use the search bar to filter by name or email
3. Each user shows:
   - Name and email
   - Role
   - Status (Unbanned/Banned)
   - Consent status (for patients)
   - Specialization (for doctors)

### 5.3 Approving Doctors

New doctor registrations require approval:

1. Go to the **"Doctors"** tab
2. Find doctors under "Pending Verification"
3. Review the doctor's information
4. Click **"Approve"** to activate their account

Once approved, the doctor can log in and access the system.

### 5.4 Banning/Unbanning Users

#### To Ban a User:
1. Find the user in the appropriate tab
2. Click **"Ban"** button
3. Confirm the action
4. User will no longer be able to log in

#### To Unban a User:
1. Find the banned user
2. Click **"Unban"** button
3. User can log in again

**Note:** Admins cannot modify medical records. This is a security feature.

### 5.5 Viewing System Logs

1. Click the **"System Logs"** tab
2. View all audit events including:
   - Action type
   - Actor (who performed the action)
   - Resource affected
   - IP address
   - Timestamp
   - Additional details

---

## 6. AI Chatbot

### 6.1 Accessing the Chatbot

1. Look for the chat bubble icon in the bottom-right corner
2. Click to open the chat panel
3. The chatbot will greet you by name

### 6.2 Text Chat

1. Type your message in the input field
2. Press Enter or click the send button
3. The chatbot will respond

**Example Questions:**
- "What are my upcoming appointments?"
- "Show my prescriptions"
- "Go to my profile"
- "What departments are available?"
- "Book an appointment with a cardiologist"

### 6.3 Voice Chat

The chatbot supports voice input in multiple languages:

1. Click the microphone button
2. Speak your question
3. Recording automatically stops after 30 seconds
4. Your speech is transcribed
5. Response is provided in the same language

**Supported Languages:**
- English
- Hindi
- Tamil
- Telugu
- Kannada
- Malayalam
- Bengali
- Gujarati
- Marathi
- And more

### 6.4 Booking Appointments via Chat

1. Ask: "I want to book an appointment"
2. Chatbot will ask for doctor preference
3. Provide date and time
4. Chatbot shows confirmation with Yes/No buttons
5. Click **"Yes, Book It"** to confirm

### 6.5 Navigation Commands

The chatbot can navigate you to different sections:

| Command | Action |
|---------|--------|
| "Go to my appointments" | Opens appointments tab |
| "Show my profile" | Opens profile tab |
| "Open prescriptions" | Opens prescriptions tab |
| "Show audit logs" | Opens audit tab |

---

## 7. Privacy & Consent

### 7.1 Understanding Consent

SecureHealthIMS follows a **"Default Deny"** policy:

- By default, no one can access your medical data
- You must explicitly grant consent for data sharing
- You can revoke consent at any time
- Revoking consent immediately blocks access

### 7.2 Managing Consent Settings

1. Go to **"Privacy"** tab in your dashboard
2. Find the "I am willing to share my data to doctors" toggle
3. **Enable** to allow doctors to view your records
4. **Disable** to block all access

### 7.3 What Consent Controls

| When Enabled | When Disabled |
|--------------|---------------|
| Doctors can search for you | You don't appear in search |
| Doctors can view your records | Records are inaccessible |
| Doctors can create visit records | Cannot create new records |
| Doctors can prescribe medication | Cannot prescribe |

### 7.4 Audit Trail

Every time someone accesses your data:

1. The access is logged
2. You can see who accessed it
3. You can see when and what they accessed
4. Logs cannot be modified or deleted

### 7.5 Patient Registration

If you're an existing patient but not registered in the system:

1. Go to **"Privacy"** tab
2. Click **"Register as User"**
3. Fill in your details
4. Click **"Submit"**

This links your patient records to your account.

---

## 8. Troubleshooting

### 8.1 Login Issues

**"Invalid credentials"**
- Check your email spelling
- Verify your password is correct
- Try resetting your password

**"Account pending approval"** (Doctors)
- Your account is awaiting admin approval
- This can take 1-2 business days
- Contact support if it takes longer

**"Account banned"**
- Your account has been suspended
- Contact administrator for assistance

### 8.2 Cannot See Patient Data (Doctors)

- Verify the patient has granted consent
- Only consented patients appear in search
- Check if you're searching with correct criteria

### 8.3 Appointment Issues

**Cannot book appointment:**
- Verify you selected a valid date (future dates only)
- Ensure you selected both date and time
- Check if the doctor is available

**Appointment not showing:**
- Refresh the page
- Check the correct tab (Appointments)
- Verify you're logged in to the correct account

### 8.4 Voice Chat Not Working

- Ensure microphone permissions are granted
- Check browser settings for microphone access
- Try using Chrome for best compatibility
- Speak clearly and avoid background noise

### 8.5 General Issues

**Page not loading:**
- Check your internet connection
- Try refreshing the page
- Clear browser cache
- Try a different browser

---

## 9. FAQ

### 9.1 Account & Security

**Q: How secure is my data?**
A: We use industry-standard security measures including encryption, JWT authentication, and role-based access control. All data access is logged.

**Q: Can I delete my account?**
A: Contact the administrator to request account deletion. Medical records may be retained for legal/regulatory requirements.

**Q: How do I reset my password?**
A: Contact the administrator for password reset assistance.

### 9.2 Privacy

**Q: Who can see my medical records?**
A: Only healthcare providers you've granted consent to, and only while consent is active. Administrators cannot view medical records.

**Q: Can I see who accessed my data?**
A: Yes, go to the "Audit" tab to see a complete log of all data access.

**Q: What happens when I revoke consent?**
A: Access is immediately blocked. Doctors can no longer view your records until you re-grant consent.

### 9.3 Appointments

**Q: Can I cancel an appointment?**
A: Contact the doctor's office or use the chatbot to request cancellation.

**Q: What if a doctor doesn't confirm my appointment?**
A: Your appointment remains in "Pending" status. Contact the clinic if no response within 2 business days.

### 9.4 For Doctors

**Q: How long does account approval take?**
A: Typically 1-2 business days. You'll be able to log in once approved.

**Q: Why can't I find a patient?**
A: The patient may not have granted consent for data sharing. Only consented patients appear in search.

**Q: Can I access records without consent?**
A: No. Patient consent is required for all data access. This is a regulatory requirement.

---

## Contact & Support

For technical support or questions:

- **GitHub Issues**: https://github.com/avkbsurya119/SecureHealthIMS_backend/issues
- **Email**: Contact your system administrator

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-11 | Documentation Team | Initial release |

---

**End of Document**

*SecureHealthIMS User Guide v1.0.0*
