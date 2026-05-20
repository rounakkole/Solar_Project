const express = require('express');
const router = express.Router();

const { pool } = require('../config/db');
const auth = require('../middleware/auth');

// ======================================
// GET ALL SUPPLIERS
// ======================================
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM suppliers ORDER BY supplier_id DESC'
    );

    res.json(rows);
  } catch (err) {
    console.log('GET SUPPLIERS ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
    });
  }
});

// ======================================
// GET SINGLE SUPPLIER (VIEW BUTTON)
// ======================================
router.get('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;

    const [rows] = await pool.query(
      'SELECT * FROM suppliers WHERE supplier_id = ?',
      [supplierId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.json(rows[0]);
  } catch (err) {
    console.log('VIEW SUPPLIER ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
    });
  }
});

// ======================================
// CREATE SUPPLIER
// ======================================
router.post('/', async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      gst_number,
      pan_number,
    } = req.body;

    if (!company_name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Company name and phone are required',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO suppliers (
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        gst_number,
        pan_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        gst_number,
        pan_number,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier_id: result.insertId,
    });
  } catch (err) {
    console.log('CREATE SUPPLIER ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
    });
  }
});

// ======================================
// UPDATE SUPPLIER
// ======================================
router.put('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      gst_number,
      status,
    } = req.body;

    await pool.query(
      `UPDATE suppliers SET
        company_name = ?,
        contact_person = ?,
        email = ?,
        phone = ?,
        address = ?,
        city = ?,
        gst_number = ?,
        status = ?
      WHERE supplier_id = ?`,
      [
        company_name,
        contact_person,
        email,
        phone,
        address,
        city,
        gst_number,
        status,
        supplierId,
      ]
    );

    res.json({
      success: true,
      message: 'Supplier updated successfully',
    });
  } catch (err) {
    console.log('UPDATE SUPPLIER ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
    });
  }
});

// ======================================
// DELETE SUPPLIER
// ======================================
router.delete('/:id', async (req, res) => {
  try {
    const supplierId = req.params.id;

    await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [
      supplierId,
    ]);

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (err) {
    console.log('DELETE SUPPLIER ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
    });
  }
});

module.exports = router;
