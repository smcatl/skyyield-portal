export default function AdminVenueFlowPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)",
      color: "#FFFFFF"
    }}>
      {/* Navigation Header */}
      <nav style={{
        backgroundColor: "#1A1F3A",
        borderBottom: "1px solid #2D3B5F",
        padding: "16px 24px"
      }}>
        <div style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "24px"
          }}>
            <a href="/portals/admin" style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none"
            }}>
              <div style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
                borderRadius: "8px"
              }}></div>
              <span style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#FFFFFF"
              }}>
                SkyYield Admin
              </span>
            </a>
            
            <div style={{
              display: "flex",
              gap: "16px",
              marginLeft: "32px"
            }}>
              <a href="/portals/admin/venue-flow" style={{
                color: "#0EA5E9",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                padding: "8px 12px",
                borderBottom: "2px solid #0EA5E9"
              }}>
                Venue Decisions
              </a>
              <a href="/portals/admin" style={{
                color: "#94A3B8",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                padding: "8px 12px"
              }}>
                Dashboard
              </a>
            </div>
          </div>
          
          <a href="/login" style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#94A3B8",
            border: "1px solid #2D3B5F",
            borderRadius: "6px",
            fontSize: "14px",
            textDecoration: "none"
          }}>
            Sign Out
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "32px 24px"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "bold",
            margin: "0 0 8px 0",
            color: "#FFFFFF"
          }}>
            Venue Scenario Decision Flows
          </h1>
          <p style={{
            color: "#94A3B8",
            fontSize: "16px",
            margin: 0
          }}>
            Decision matrices for different venue types and ownership scenarios
          </p>
        </div>

        {/* Scenario Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
          gap: "24px",
          marginBottom: "32px"
        }}>
          {/* Scenario 1: Owns Building & Business */}
          <div style={{
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            borderRadius: "12px",
            padding: "24px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #10F981 0%, #00FF66 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold"
              }}>
                1
              </div>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                margin: 0,
                color: "#FFFFFF"
              }}>
                Owns Building & Business
              </h2>
            </div>

            <p style={{
              color: "#94A3B8",
              fontSize: "14px",
              marginBottom: "20px",
              lineHeight: "1.6"
            }}>
              Owner controls both the property and operates the business
            </p>

            <div style={{
              backgroundColor: "#0A0F2C",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid #2D3B5F"
            }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  color: "#64748B",
                  fontSize: "11px",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Decision Path
                </div>
                <div style={{
                  color: "#FFFFFF",
                  fontSize: "14px",
                  lineHeight: "1.8"
                }}>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#0EA5E9" }}>→</span> Revenue Share Agreement
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#0EA5E9" }}>→</span> Single Contract
                  </div>
                  <div>
                    <span style={{ color: "#10F981" }}>✓</span> Simplest Setup
                  </div>
                </div>
              </div>

              <div style={{
                padding: "12px",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(14, 165, 233, 0.2)"
              }}>
                <div style={{
                  color: "#0EA5E9",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "4px"
                }}>
                  CONTRACT TYPE
                </div>
                <div style={{
                  color: "#94A3B8",
                  fontSize: "13px"
                }}>
                  Revenue Share with single owner entity
                </div>
              </div>
            </div>
          </div>

          {/* Scenario 2: Owns Business Only */}
          <div style={{
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            borderRadius: "12px",
            padding: "24px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold"
              }}>
                2
              </div>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                margin: 0,
                color: "#FFFFFF"
              }}>
                Owns Business Only
              </h2>
            </div>

            <p style={{
              color: "#94A3B8",
              fontSize: "14px",
              marginBottom: "20px",
              lineHeight: "1.6"
            }}>
              Business owner rents/leases the property from landlord
            </p>

            <div style={{
              backgroundColor: "#0A0F2C",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid #2D3B5F"
            }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  color: "#64748B",
                  fontSize: "11px",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Decision Path
                </div>
                <div style={{
                  color: "#FFFFFF",
                  fontSize: "14px",
                  lineHeight: "1.8"
                }}>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#0EA5E9" }}>→</span> Check Landlord Stance
                  </div>
                  <div style={{ marginBottom: "12px", paddingLeft: "20px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: "#10F981" }}>✓</span> <strong>Supports:</strong> Revenue share
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: "#FBBF24" }}>⚠</span> <strong>Neutral:</strong> $50/device
                    </div>
                    <div>
                      <span style={{ color: "#EF4444" }}>✗</span> <strong>Opposes:</strong> Cannot proceed
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: "12px",
                backgroundColor: "rgba(251, 191, 36, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(251, 191, 36, 0.2)"
              }}>
                <div style={{
                  color: "#FBBF24",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "4px"
                }}>
                  CONTRACT TYPE
                </div>
                <div style={{
                  color: "#94A3B8",
                  fontSize: "13px"
                }}>
                  Conditional - requires landlord permission
                </div>
              </div>
            </div>
          </div>

          {/* Scenario 3: Landlord Only */}
          <div style={{
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            borderRadius: "12px",
            padding: "24px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold"
              }}>
                3
              </div>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                margin: 0,
                color: "#FFFFFF"
              }}>
                Landlord Only
              </h2>
            </div>

            <p style={{
              color: "#94A3B8",
              fontSize: "14px",
              marginBottom: "20px",
              lineHeight: "1.6"
            }}>
              Property owner with multiple tenants (retail center, office)
            </p>

            <div style={{
              backgroundColor: "#0A0F2C",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid #2D3B5F"
            }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  color: "#64748B",
                  fontSize: "11px",
                  marginBottom: "6px",
                  textTransform: "uppercase"
                }}>
                  Decision Path
                </div>
                <div style={{
                  color: "#FFFFFF",
                  fontSize: "14px",
                  lineHeight: "1.8"
                }}>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#0EA5E9" }}>→</span> Coverage Assessment
                  </div>
                  <div style={{ paddingLeft: "20px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ color: "#10F981" }}>✓</span> <strong>Full:</strong> Revenue share
                    </div>
                    <div>
                      <span style={{ color: "#FBBF24" }}>⚠</span> <strong>Select:</strong> Revenue - $50/device/tenant
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: "12px",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(14, 165, 233, 0.2)"
              }}>
                <div style={{
                  color: "#0EA5E9",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "4px"
                }}>
                  CONTRACT TYPE
                </div>
                <div style={{
                  color: "#94A3B8",
                  fontSize: "13px"
                }}>
                  Revenue share with optional tenant fees
                </div>
              </div>
            </div>
          </div>

          {/* Scenario 4: Multiple Storefronts */}
          <div style={{
            backgroundColor: "#1A1F3A",
            border: "1px solid #2D3B5F",
            borderRadius: "12px",
            padding: "24px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #A855F7 0%, #9333EA 100%)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "bold"
              }}>
                4
              </div>
              <h2 style={{
                fontSize: "20px",
                fontWeight: "bold",
                margin: 0,
                color: "#FFFFFF"
              }}>
                Multiple Storefronts
              </h2>
            </div>

            <p style={{
              color: "#94A3B8",
              fontSize: "14px",
              marginBottom: "20px",
              lineHeight: "1.6"
            }}>
              Franchise or multi-location business with mixed ownership
            </p>

            <div style={{
              backgroundColor: "#0A0F2C",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid #2D3B5F"
            }}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  color: "#64748B",
                  fontSize: "11px",
                  marginBottom: "6px",
                  textTransform: "uppercase"
                }}>
                  Decision Path
                </div>
                <div style={{
                  color: "#FFFFFF",
                  fontSize: "14px",
                  lineHeight: "1.8"
                }}>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#0EA5E9" }}>→</span> Aggregate Locations
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#0EA5E9" }}>→</span> Master Agreement
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ color: "#0EA5E9" }}>→</span> Location Addendums
                  </div>
                  <div>
                    <span style={{ color: "#10F981" }}>✓</span> Volume = Better Rates
                  </div>
                </div>
              </div>

              <div style={{
                padding: "12px",
                backgroundColor: "rgba(168, 85, 247, 0.1)",
                borderRadius: "6px",
                border: "1px solid rgba(168, 85, 247, 0.2)"
              }}>
                <div style={{
                  color: "#A855F7",
                  fontSize: "12px",
                  fontWeight: "600",
                  marginBottom: "4px"
                }}>
                  CONTRACT TYPE
                </div>
                <div style={{
                  color: "#94A3B8",
                  fontSize: "13px"
                }}>
                  Master + location-specific addendums
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference Table */}
        <div style={{
          backgroundColor: "#1A1F3A",
          border: "1px solid #2D3B5F",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "32px"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "#0EA5E9"
          }}>
            Quick Decision Matrix
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{
                  backgroundColor: "#0A0F2C",
                  borderBottom: "2px solid #2D3B5F"
                }}>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#0EA5E9",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    SCENARIO
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#0EA5E9",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    OWNERSHIP
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#0EA5E9",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    AGREEMENT
                  </th>
                  <th style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#0EA5E9",
                    fontSize: "13px",
                    fontWeight: "600"
                  }}>
                    KEY CONSIDERATION
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #2D3B5F" }}>
                  <td style={{ padding: "16px", color: "#FFFFFF", fontSize: "14px" }}>
                    Scenario 1
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Building + Business Owner
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      padding: "4px 8px",
                      backgroundColor: "rgba(16, 249, 129, 0.1)",
                      color: "#10F981",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      Revenue Share
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Simplest setup - one contract
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #2D3B5F" }}>
                  <td style={{ padding: "16px", color: "#FFFFFF", fontSize: "14px" }}>
                    Scenario 2
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Business Only (Tenant)
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      padding: "4px 8px",
                      backgroundColor: "rgba(251, 191, 36, 0.1)",
                      color: "#FBBF24",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      Conditional
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Landlord permission critical
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #2D3B5F" }}>
                  <td style={{ padding: "16px", color: "#FFFFFF", fontSize: "14px" }}>
                    Scenario 3
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Landlord Only
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      padding: "4px 8px",
                      backgroundColor: "rgba(14, 165, 233, 0.1)",
                      color: "#0EA5E9",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      Revenue Share
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Coverage scope affects terms
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "16px", color: "#FFFFFF", fontSize: "14px" }}>
                    Scenario 4
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Multiple Locations
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span style={{
                      padding: "4px 8px",
                      backgroundColor: "rgba(168, 85, 247, 0.1)",
                      color: "#A855F7",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500"
                    }}>
                      Master + Addendums
                    </span>
                  </td>
                  <td style={{ padding: "16px", color: "#94A3B8", fontSize: "14px" }}>
                    Volume drives better rates
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Principles */}
        <div style={{
          backgroundColor: "#1A1F3A",
          border: "1px solid #2D3B5F",
          borderRadius: "12px",
          padding: "32px"
        }}>
          <h2 style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "#0EA5E9"
          }}>
            Key Principles
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px"
          }}>
            <div style={{
              padding: "20px",
              backgroundColor: "#0A0F2C",
              borderRadius: "8px",
              border: "1px solid #2D3B5F"
            }}>
              <div style={{ color: "#10F981", fontSize: "24px", marginBottom: "12px" }}>✓</div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#FFFFFF",
                marginBottom: "8px"
              }}>
                Always Revenue Share When Possible
              </h3>
              <p style={{
                color: "#94A3B8",
                fontSize: "14px",
                margin: 0,
                lineHeight: "1.6"
              }}>
                Default to revenue sharing for aligned incentives and long-term partnerships
              </p>
            </div>

            <div style={{
              padding: "20px",
              backgroundColor: "#0A0F2C",
              borderRadius: "8px",
              border: "1px solid #2D3B5F"
            }}>
              <div style={{ color: "#FBBF24", fontSize: "24px", marginBottom: "12px" }}>⚠</div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#FFFFFF",
                marginBottom: "8px"
              }}>
                Landlord Permission is Critical
              </h3>
              <p style={{
                color: "#94A3B8",
                fontSize: "14px",
                margin: 0,
                lineHeight: "1.6"
              }}>
                For tenant scenarios, secure explicit landlord approval before installation
              </p>
            </div>

            <div style={{
              padding: "20px",
              backgroundColor: "#0A0F2C",
              borderRadius: "8px",
              border: "1px solid #2D3B5F"
            }}>
              <div style={{ color: "#0EA5E9", fontSize: "24px", marginBottom: "12px" }}>→</div>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#FFFFFF",
                marginBottom: "8px"
              }}>
                Scale Drives Better Terms
              </h3>
              <p style={{
                color: "#94A3B8",
                fontSize: "14px",
                margin: 0,
                lineHeight: "1.6"
              }}>
                Multiple locations unlock volume discounts and improved revenue percentages
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}