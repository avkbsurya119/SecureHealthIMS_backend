
import { supabase } from '../config/supabaseClient.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get dashboard stats
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req, res, next) => {
    try {
        // Run queries in parallel for better performance
        const [
            { count: doctorCount, error: doctorError },
            { count: patientCount, error: patientError },
            { count: nurseCount, error: nurseError },
            { count: appointmentCount, error: appointmentError },
            { data: invoices, error: invoiceError }
        ] = await Promise.all([
            supabase.from('doctors').select('*', { count: 'exact', head: true }),
            supabase.from('patients').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'nurse'),
            supabase.from('appointments').select('*', { count: 'exact', head: true }),
            supabase.from('invoices').select('total').eq('status', 'Paid')
        ]);

        if (doctorError) throw new Error(doctorError.message);
        if (patientError) throw new Error(patientError.message);
        if (nurseError) throw new Error(nurseError.message);
        if (appointmentError) throw new Error(appointmentError.message);
        if (invoiceError) throw new Error(invoiceError.message);

        const totalIncome = invoices ? invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) : 0;

        res.json({
            success: true,
            data: {
                doctors: doctorCount || 0,
                patients: patientCount || 0,
                nurses: nurseCount || 0,
                appointments: appointmentCount || 0,
                income: totalIncome
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all pending doctor registration requests
 * GET /api/admin/requests
 */
export const getPendingDoctors = async (req, res, next) => {
    try {
        const { data: doctors, error } = await supabase
            .from('doctors')
            .select('id, name, email, specialization, phone, department_id, created_at, verified')
            .eq('verified', false)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        res.json({
            success: true,
            count: doctors.length,
            data: doctors
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users (doctors, patients, nurses)
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res, next) => {
    try {
        // Fetch patients - only non-sensitive fields (no phone, gender, medical data, consents)
        const { data: patients, error: patientsError } = await supabase
            .from('patients')
            .select('id, name, email, created_at, verified, user_id')
            .order('created_at', { ascending: false });

        if (patientsError) throw new Error(patientsError.message);

        // Fetch doctors from the users table (new registrations go here, not legacy doctors table)
        const { data: doctors, error: doctorsError } = await supabase
            .from('users')
            .select('id, full_name, email, specialization, phone, created_at, approval_status')
            .eq('role', 'doctor')
            .order('created_at', { ascending: false });

        if (doctorsError) throw new Error(doctorsError.message);

        // Fetch nurses
        const { data: nurses, error: nursesError } = await supabase
            .from('users')
            .select('id, full_name, email, created_at, is_active, approval_status')
            .eq('role', 'nurse')
            .order('created_at', { ascending: false });

        if (nursesError) throw new Error(nursesError.message);

        // Combine and format - patient details are minimal
        const allUsers = [
            ...patients.map(p => ({
                id: p.id,
                name: p.name,
                email: p.email,
                created_at: p.created_at,
                verified: p.verified,
                user_id: p.user_id,
                role: 'patient'
            })),
            ...doctors.map(d => ({
                id: d.id,
                name: d.full_name,
                email: d.email,
                specialization: d.specialization,
                phone: d.phone,
                created_at: d.created_at,
                role: 'doctor',
                // verified=true means approved; frontend uses !verified to show Approve button
                verified: d.approval_status === 'approved',
            })),
            ...nurses.map(n => ({
                id: n.id,
                name: n.full_name,
                email: n.email,
                created_at: n.created_at,
                role: 'nurse',
                isverified: n.approval_status !== 'approved',
                verified: n.is_active
            }))
        ];

        res.json({
            success: true,
            count: allUsers.length,
            data: allUsers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get specific doctor details
 * GET /api/admin/doctors/:id
 */
export const getDoctorDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: doctor, error } = await supabase
            .from('doctors')
            .select('*, departments(name)')
            .eq('id', id)
            .single();

        if (error || !doctor) {
            throw new NotFoundError('Doctor not found');
        }

        res.json({
            success: true,
            data: doctor
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve a doctor account
 * POST /api/admin/approve/:id
 */
export const approveDoctor = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Look up the doctor in the users table (new registration flow)
        const { data: doctor, error: fetchError } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .eq('id', id)
            .eq('role', 'doctor')
            .single();

        if (fetchError || !doctor) {
            throw new NotFoundError('Doctor not found');
        }

        // Approve: update approval_status in users table
        const { error: updateError } = await supabase
            .from('users')
            .update({ approval_status: 'approved' })
            .eq('id', id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        // Also update legacy doctors table if an entry exists (backward compatibility)
        await supabase.from('doctors').update({ verified: true }).eq('user_id', id);

        res.json({
            success: true,
            message: `Doctor ${doctor.full_name} has been approved`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve a nurse account (sets isverified = false allowing login)
 * POST /api/admin/approve-nurse/:id
 */
export const approveNurse = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Verify user is a nurse
        const { data: nurse, error: fetchError } = await supabase
            .from('users')
            .select('id, full_name, email, role')
            .eq('id', id)
            .single();

        if (fetchError || !nurse || nurse.role !== 'nurse') {
            throw new NotFoundError('Nurse not found');
        }

        // Update isverified status to false (approved) by setting approval_status to 'approved'
        const { error: updateError } = await supabase
            .from('users')
            .update({ approval_status: 'approved' })
            .eq('id', id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        res.json({
            success: true,
            message: `Nurse ${nurse.full_name} has been approved`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all appointments
 * GET /api/admin/appointments
 */
export const getAllAppointments = async (req, res, next) => {
    try {
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('id, date, time, status, doctor_id, patient_id, doctors(name)')
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);

        // Admin sees appointment metadata but not patient names (privacy)
        const formatted = appointments.map(a => ({
            id: a.id,
            date: a.date,
            time: a.time,
            status: a.status,
            doctor_id: a.doctor_id,
            patient_id: a.patient_id,
            patient_name: '[REDACTED]',
            doctor_name: a.doctors?.name || 'Unknown'
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all invoices
 * GET /api/admin/invoices
 */
export const getAllInvoices = async (req, res, next) => {
    try {
        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('id, date, total, status, patient_id')
            .order('date', { ascending: false });

        if (error) throw new Error(error.message);

        // Admin sees invoice metadata but not patient names (privacy)
        const formatted = invoices.map(i => ({
            id: i.id,
            date: i.date,
            total: i.total,
            status: i.status,
            patient_id: i.patient_id,
            patient_name: '[REDACTED]'
        }));

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        next(error);
    }
};


export const getSecurityAssumptions = async (req, res, next) => {
    try {
        // Get the directory of the current module
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Path to SECURITY_ASSUMPTIONS.md (one level up from controllers)
        const filePath = path.join(__dirname, '..', '..', 'SECURITY_ASSUMPTIONS.md');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new NotFoundError('Security assumptions document not found');
        }

        // Read the file
        const content = fs.readFileSync(filePath, 'utf8');

        res.json({
            success: true,
            data: {
                content: content,
                lastModified: new Date(fs.statSync(filePath).mtime).toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

export const banUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['doctor', 'patient'].includes(role)) {
            // Check if it's a doctor or patient by trying to find them? 
            // Or assume frontend sends role.
            // Frontend handleBan needs to send role.
            throw new ValidationError('Role (doctor/patient) is required in body');
        }

        const table = role === 'doctors' || role === 'doctor' ? 'doctors' : 'patients';

        // Verify user exists
        const { data: user, error: fetchError } = await supabase
            .from(table)
            .select('id, name, user_id')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            throw new NotFoundError(`${role} not found`);
        }

        // Update verified status to false (BAN)
        const { error: updateError } = await supabase
            .from(table)
            .update({ verified: false })
            .eq('id', id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        res.json({
            success: true,
            message: `User ${user.name} has been banned (verification revoked)`
        });
    } catch (error) {
        next(error);
    }
};

export const unbanUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['doctor', 'patient'].includes(role)) {
            throw new ValidationError('Role (doctor/patient) is required in body');
        }

        const table = role === 'doctors' || role === 'doctor' ? 'doctors' : 'patients';

        // Verify user exists
        const { data: user, error: fetchError } = await supabase
            .from(table)
            .select('id, name, user_id')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            throw new NotFoundError(`${role} not found`);
        }

        // Update verified status to true (UNBAN)
        const { error: updateError } = await supabase
            .from(table)
            .update({ verified: true })
            .eq('id', id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        res.json({
            success: true,
            message: `User ${user.name} has been unbanned`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all security incident logs
 * GET /api/admin/incidents
 */
export const getIncidentLogs = async (req, res, next) => {
    try {
        const { limit = 100 } = req.query;
        const { data: logs, error } = await supabase
            .from('incident_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw new Error(error.message);

        res.json({
            success: true,
            data: logs || []
        });
    } catch (error) {
        next(error);
    }
};
