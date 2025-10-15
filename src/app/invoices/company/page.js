"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Layout from "../../components/Layout";

export default function CompanySettingsPage() {
  const [company, setCompany] = useState({
    name: "Your Company Name",
    email: "info@yourcompany.com",
    phone: "+1 (555) 123-4567",
    address: {
      street: "123 Business Street",
      city: "City",
      state: "State",
      zipCode: "12345",
      country: "Country"
    },
    taxId: "TAX123456789",
    website: "www.yourcompany.com"
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "super-admin" && userRole !== "admin") {
      router.push("/");
      return;
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Store in localStorage for now (you can implement API later)
    localStorage.setItem("companySettings", JSON.stringify(company));
    
    setTimeout(() => {
      setLoading(false);
      alert("Company settings saved successfully!");
    }, 1000);
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setCompany(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setCompany(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1"><i className="bi bi-building me-2"></i>Company Settings</h2>
            <p className="text-muted mb-0">Configure your company details for invoices</p>
          </div>
          <Link href="/invoices" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>Back to Invoices
          </Link>
        </div>

        <div className="row">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="mb-0"><i className="bi bi-gear me-2"></i>Company Information</h6>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Company Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={company.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email *</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        required
                        value={company.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone</label>
                      <input 
                        type="tel" 
                        className="form-control"
                        value={company.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Website</label>
                      <input 
                        type="url" 
                        className="form-control"
                        value={company.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-12">
                      <label className="form-label fw-semibold">Street Address</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={company.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">City</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={company.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">State</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={company.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">ZIP Code</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={company.address.zipCode}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold">Country</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={company.address.country}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Tax ID</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={company.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>Save Settings
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="mb-0"><i className="bi bi-eye me-2"></i>Preview</h6>
              </div>
              <div className="card-body">
                <div className="border p-3 rounded bg-light">
                  <h5 className="mb-2">{company.name}</h5>
                  <p className="mb-1 small">{company.address.street}</p>
                  <p className="mb-1 small">{company.address.city}, {company.address.state} {company.address.zipCode}</p>
                  <p className="mb-1 small">{company.address.country}</p>
                  <p className="mb-1 small">Phone: {company.phone}</p>
                  <p className="mb-1 small">Email: {company.email}</p>
                  <p className="mb-1 small">Website: {company.website}</p>
                  <p className="mb-0 small">Tax ID: {company.taxId}</p>
                </div>
                <small className="text-muted mt-2 d-block">This is how your company info will appear on invoices</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}