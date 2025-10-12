"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../../../components/Layout";

export default function DepreciationPage() {
  const router = useRouter();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets");
      const data = await response.json();
      setAssets(Array.isArray(data) ? data.filter(a => a.status === 'active') : []);
    } catch (error) {
      console.error("Error fetching assets:", error);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDepreciation = (asset) => {
    const purchaseDate = new Date(asset.purchaseDate);
    const currentDate = new Date();
    const yearsElapsed = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
    
    // Straight-line depreciation
    const annualDepreciation = (asset.originalValue - (asset.salvageValue || 0)) / (asset.usefulLife || 5);
    const totalDepreciation = Math.min(annualDepreciation * yearsElapsed, asset.originalValue - (asset.salvageValue || 0));
    
    return {
      annualDepreciation,
      totalDepreciation,
      currentValue: asset.originalValue - totalDepreciation
    };
  };

  const runDepreciation = async () => {
    if (selectedAssets.length === 0) {
      alert("Please select at least one asset to depreciate.");
      return;
    }

    setProcessing(true);
    try {
      for (const assetId of selectedAssets) {
        const asset = assets.find(a => a._id === assetId);
        const depreciation = calculateDepreciation(asset);
        
        await fetch(`/api/assets/${assetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...asset,
            accumulatedDepreciation: depreciation.totalDepreciation,
            currentValue: depreciation.currentValue
          })
        });
      }
      
      alert("Depreciation calculated successfully!");
      router.push("/accounting/assets");
    } catch (error) {
      console.error("Error running depreciation:", error);
      alert("Error calculating depreciation. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const toggleAssetSelection = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const selectAll = () => {
    setSelectedAssets(assets.map(a => a._id));
  };

  const clearSelection = () => {
    setSelectedAssets([]);
  };

  if (loading) return <Layout><div>Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>📊 Run Depreciation</h2>
          <div>
            <button className="btn btn-outline-secondary me-2" onClick={selectAll}>
              Select All
            </button>
            <button className="btn btn-outline-secondary me-2" onClick={clearSelection}>
              Clear Selection
            </button>
            <button 
              className="btn btn-success me-2" 
              onClick={runDepreciation}
              disabled={processing || selectedAssets.length === 0}
            >
              {processing ? "Processing..." : "Calculate Depreciation"}
            </button>
            <button className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </div>

        <div className="alert alert-info">
          <strong>Note:</strong> This will calculate and update depreciation for selected assets using straight-line method.
          Current depreciation values will be overwritten.
        </div>

        <div className="card">
          <div className="card-header">
            <h5>Select Assets for Depreciation ({selectedAssets.length} selected)</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>
                      <input 
                        type="checkbox" 
                        checked={selectedAssets.length === assets.length && assets.length > 0}
                        onChange={() => selectedAssets.length === assets.length ? clearSelection() : selectAll()}
                      />
                    </th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Purchase Date</th>
                    <th>Original Value</th>
                    <th>Current Depreciation</th>
                    <th>Calculated Depreciation</th>
                    <th>New Current Value</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const depreciation = calculateDepreciation(asset);
                    return (
                      <tr key={asset._id}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selectedAssets.includes(asset._id)}
                            onChange={() => toggleAssetSelection(asset._id)}
                          />
                        </td>
                        <td><strong>{asset.name}</strong></td>
                        <td>{asset.category}</td>
                        <td>{new Date(asset.purchaseDate).toLocaleDateString()}</td>
                        <td>₹{asset.originalValue?.toFixed(2)}</td>
                        <td>₹{(asset.accumulatedDepreciation || 0).toFixed(2)}</td>
                        <td className="text-warning">₹{depreciation.totalDepreciation.toFixed(2)}</td>
                        <td className="text-success">₹{depreciation.currentValue.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}