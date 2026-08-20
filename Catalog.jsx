import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { CartContext } from '../../context/CartContext';
import { AuthContext } from '../../context/AuthContext';

const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);

  const {
    cart,
    addToCart,
    updateQuantity,
    clearCart,
    cartTotal
  } = useContext(CartContext);

  const { user } = useContext(AuthContext);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);


  // =====================================================
  // FETCH PRODUCTS
  // =====================================================

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        const { data } =
          await axios.get('/api/products');

        setProducts(data);

      } catch (err) {

        console.error(
          'Failed to fetch products:',
          err
        );

      }

    };

    fetchProducts();

  }, []);


  // =====================================================
  // FETCH BRANCHES
  // =====================================================

  useEffect(() => {

    const fetchBranches = async () => {

      try {

        const { data } =
          await axios.get('/api/branches');

        setBranches(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.error(
          'Failed to fetch branches:',
          err
        );

      }

    };

    fetchBranches();

  }, []);


  // =====================================================
  // FIND CURRENT BRANCH
  // =====================================================

  const getCurrentBranch = () => {

    if (!Array.isArray(branches) || branches.length === 0) {
      return null;
    }


    // -------------------------------------------------
    // Possible branch ID fields from user
    // -------------------------------------------------

    const branchId =
      user?.branchId ||
      user?.branch_id ||
      user?.branch?._id ||
      user?.branch?.id;


    // -------------------------------------------------
    // If user has branchId, use it
    // -------------------------------------------------

    if (branchId) {

      const found =
        branches.find(
          branch =>
            String(branch._id) ===
            String(branchId)
        );

      if (found) {
        return found;
      }

    }


    // -------------------------------------------------
    // If user.branch itself is an ID/string
    // -------------------------------------------------

    if (
      user?.branch &&
      typeof user.branch === 'string'
    ) {

      const found =
        branches.find(
          branch =>
            String(branch._id) ===
            String(user.branch)
        );

      if (found) {
        return found;
      }

    }


    // -------------------------------------------------
    // Try matching username with branch name
    // -------------------------------------------------

    if (user?.username) {

      const username =
        String(user.username)
          .trim()
          .toLowerCase();


      const found =
        branches.find(branch => {

          const branchName =
            String(branch.name || '')
              .trim()
              .toLowerCase();

          return (
            branchName === username
          );

        });


      if (found) {
        return found;
      }

    }


    return null;

  };


  // =====================================================
  // PLACE ORDER
  // =====================================================

  const handlePlaceOrder = async () => {

    if (cart.length === 0) {
      return;
    }


    const validCart =
      cart.filter(
        item =>
          Number(item.quantity) > 0
      );


    if (validCart.length === 0) {
      return;
    }


    try {


      // =================================================
      // FIND BRANCH
      // =================================================

      const currentBranch =
        getCurrentBranch();


      // =================================================
      // BRANCH INFORMATION
      // =================================================

      const branchName =
        currentBranch?.name ||
        user?.branchName ||
        user?.branch?.name ||
        user?.username ||
        'Unknown Branch';


      const managerName =
        currentBranch?.managerName ||
        'Unknown Manager';


      const managerPhone =
        currentBranch?.whatsAppNumber ||
        '';


      // =================================================
      // DATABASE ORDER ITEMS
      // =================================================

      const items =
        validCart.map(item => ({

          product:
            item.product._id,

          quantity:
            Number(item.quantity),

          unit:
            item.unit || '',

          price:
            Number(item.price)

        }));


      // =================================================
      // INVOICE ITEMS
      // =================================================

      const invoiceItems =
        validCart.map(item => {

          const quantity =
            Number(item.quantity);

          const price =
            Number(item.price);

          const total =
            quantity * price;


          return {

            name:
              item.product.name,

            qty:
              quantity,

            unit:
              item.unit || '',

            price:
              price,

            total:
              total

          };

        });


      // =================================================
      // CALCULATE TOTAL
      // =================================================

      const calculatedTotal =
        invoiceItems.reduce(
          (sum, item) =>
            sum +
            Number(item.total || 0),
          0
        );


      // =================================================
      // N8N WEBHOOK PAYLOAD
      // =================================================

      const webhookPayload = {

        // -------------------------------
        // BRANCH DETAILS
        // -------------------------------

        branch:
          branchName,

        manager:
          managerName,

        phone:
          managerPhone,


        // -------------------------------
        // PRODUCTS
        // -------------------------------

        items:
          invoiceItems,


        // -------------------------------
        // TOTAL
        // -------------------------------

        price:
          calculatedTotal,

        gst:
          0,

        total:
          calculatedTotal

      };


      // =================================================
      // DEBUG
      // =================================================

      console.log(
        'BRANCH:',
        branchName
      );

      console.log(
        'MANAGER:',
        managerName
      );

      console.log(
        'PHONE:',
        managerPhone
      );

      console.log(
        'N8N PAYLOAD:',
        webhookPayload
      );


      // =================================================
      // SEND TO N8N
      // =================================================

      try {

        await axios.post(

          'https://n8n.muhammadnihal.in/webhook/chef-bill',

          webhookPayload,

          {
            headers: {
              'Content-Type':
                'application/json'
            }
          }

        );

        console.log(
          'Invoice webhook sent successfully'
        );

      } catch (webhookErr) {

        console.error(
          'Webhook failed:',
          webhookErr
        );

      }


      // =================================================
      // SAVE ORDER
      // =================================================

      await axios.post(
        '/api/orders',
        {
          items,
          totalAmount:
            calculatedTotal
        }
      );


      // =================================================
      // CLEAR CART
      // =================================================

      clearCart();

      setShowCartModal(false);

      setShowSuccessModal(true);


    } catch (err) {

      console.error(
        'Order placement failed:',
        err
      );

      alert(
        err.response?.data?.message ||
        'Error placing order'
      );

    }

  };


  // =====================================================
  // CART COUNT
  // =====================================================

  const cartItemsCount =
    cart.reduce(
      (acc, item) =>
        acc +
        (Number(item.quantity) || 0),
      0
    );


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div
      style={{
        position: 'relative',
        paddingBottom: '80px'
      }}
    >


      {/* =================================================
          SUCCESS MODAL
          ================================================= */}

      {showSuccessModal && (

        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,

            width: '100vw',
            height: '100vh',

            backgroundColor:
              'rgba(0,0,0,0.7)',

            zIndex: 9999,

            display: 'flex',

            justifyContent:
              'center',

            alignItems:
              'center'
          }}
        >

          <div
            style={{
              backgroundColor:
                'var(--white)',

              padding: '3rem',

              borderRadius: '16px',

              textAlign: 'center',

              maxWidth: '400px',

              boxShadow:
                '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >

            <div
              style={{
                width: '80px',
                height: '80px',

                borderRadius: '50%',

                backgroundColor:
                  'var(--success)',

                color: 'white',

                display: 'flex',

                justifyContent:
                  'center',

                alignItems:
                  'center',

                fontSize: '40px',

                margin:
                  '0 auto 1.5rem auto'
              }}
            >
              ✓
            </div>


            <h2
              style={{
                margin:
                  '0 0 1rem 0',

                color:
                  'var(--black)'
              }}
            >
              Order Placed!
            </h2>


            <p
              style={{
                color:
                  'var(--gray-dark)',

                marginBottom:
                  '2rem'
              }}
            >
              Your order has been successfully
              sent to the Central Kitchen and
              is pending confirmation.
            </p>


            <button
              className="btn btn-primary w-full"

              onClick={() =>
                setShowSuccessModal(false)
              }
            >
              Continue Ordering
            </button>

          </div>

        </div>

      )}


      {/* =================================================
          CART MODAL
          ================================================= */}

      {showCartModal && (

        <div
          style={{
            position: 'fixed',

            top: 0,
            left: 0,

            width: '100vw',
            height: '100vh',

            backgroundColor:
              'rgba(0,0,0,0.5)',

            zIndex: 9998,

            display: 'flex',

            justifyContent:
              'center',

            alignItems:
              'center',

            padding: '1rem'
          }}
        >

          <div
            style={{
              backgroundColor:
                'var(--white)',

              padding: '2rem',

              borderRadius: '16px',

              width: '100%',

              maxWidth: '500px',

              maxHeight: '80vh',

              overflowY: 'auto',

              boxShadow:
                '0 10px 25px rgba(0,0,0,0.2)',

              position: 'relative'
            }}
          >

            <button
              onClick={() =>
                setShowCartModal(false)
              }

              style={{
                position: 'absolute',

                top: '15px',

                right: '15px',

                background: 'none',

                border: 'none',

                fontSize: '1.5rem',

                cursor: 'pointer',

                color:
                  'var(--gray-dark)'
              }}
            >
              &times;
            </button>


            <h2
              style={{
                marginTop: 0
              }}
            >
              Current Cart
            </h2>


            {cart.length === 0 ? (

              <p
                className="text-center"

                style={{
                  color:
                    'var(--gray-dark)',

                  padding:
                    '2rem 0'
                }}
              >
                Cart is empty
              </p>

            ) : (

              <div className="mt-2">

                {cart.map(item => (

                  <div
                    key={item.product._id}

                    style={{
                      display: 'flex',

                      justifyContent:
                        'space-between',

                      alignItems:
                        'center',

                      marginBottom:
                        '1rem',

                      borderBottom:
                        '1px solid var(--gray)',

                      paddingBottom:
                        '1rem'
                    }}
                  >

                    <div>

                      <div
                        style={{
                          fontWeight:
                            'bold',

                          fontSize:
                            '1.1rem'
                        }}
                      >
                        {item.product.name}
                      </div>


                      <div
                        style={{
                          fontSize:
                            '0.875rem',

                          color:
                            'var(--gray-dark)'
                        }}
                      >
                        ₹
                        {Number(
                          item.price
                        ).toFixed(2)}

                        {' '}per {item.unit}
                      </div>


                      <div
                        style={{
                          fontSize:
                            '0.8rem',

                          marginTop:
                            '4px',

                          color:
                            'var(--primary)',

                          fontWeight:
                            'bold'
                        }}
                      >
                        Total: ₹
                        {(
                          Number(item.price) *
                          Number(item.quantity || 0)
                        ).toFixed(2)}
                      </div>

                    </div>


                    <div
                      style={{
                        display: 'flex',

                        alignItems:
                          'center',

                        gap: '0.75rem',

                        backgroundColor:
                          'var(--gray-light)',

                        padding:
                          '0.25rem',

                        borderRadius:
                          '8px'
                      }}
                    >

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product._id,

                            (
                              Number(
                                item.quantity
                              ) || 0
                            ) - 1
                          )
                        }

                        style={{
                          border: 'none',

                          background:
                            'var(--white)',

                          width: '30px',

                          height: '30px',

                          borderRadius:
                            '4px',

                          cursor:
                            'pointer',

                          fontWeight:
                            'bold'
                        }}
                      >
                        -
                      </button>


                      <input
                        type="number"

                        value={
                          item.quantity
                        }

                        onChange={(e) => {

                          const val =
                            e.target.value;


                          if (val === '') {

                            updateQuantity(
                              item.product._id,
                              ''
                            );

                          } else {

                            const num =
                              parseInt(
                                val,
                                10
                              );


                            if (
                              !isNaN(num) &&
                              num >= 0
                            ) {

                              updateQuantity(
                                item.product._id,
                                num
                              );

                            }

                          }

                        }}

                        style={{
                          fontWeight:
                            'bold',

                          width: '40px',

                          textAlign:
                            'center',

                          border: 'none',

                          background:
                            'transparent',

                          outline: 'none'
                        }}
                      />


                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product._id,

                            (
                              Number(
                                item.quantity
                              ) || 0
                            ) + 1
                          )
                        }

                        style={{
                          border: 'none',

                          background:
                            'var(--white)',

                          width: '30px',

                          height: '30px',

                          borderRadius:
                            '4px',

                          cursor:
                            'pointer',

                          fontWeight:
                            'bold'
                        }}
                      >
                        +
                      </button>

                    </div>

                  </div>

                ))}


                <div
                  style={{
                    display: 'flex',

                    justifyContent:
                      'space-between',

                    alignItems:
                      'center',

                    marginTop:
                      '1.5rem',

                    marginBottom:
                      '1rem'
                  }}
                >

                  <span
                    style={{
                      fontSize:
                        '1.2rem',

                      fontWeight:
                        'bold'
                    }}
                  >
                    Total:
                  </span>


                  <span
                    style={{
                      fontSize:
                        '1.5rem',

                      fontWeight:
                        'bold',

                      color:
                        'var(--primary)'
                    }}
                  >
                    ₹
                    {Number(
                      cartTotal
                    ).toFixed(2)}
                  </span>

                </div>


                <button
                  className="btn btn-primary w-full"

                  style={{
                    padding:
                      '1rem',

                    fontSize:
                      '1.1rem'
                  }}

                  onClick={
                    handlePlaceOrder
                  }
                >
                  Place Order
                </button>

              </div>

            )}

          </div>

        </div>

      )}


      {/* =================================================
          FLOATING CART
          ================================================= */}

      <button

        onClick={() =>
          setShowCartModal(true)
        }

        style={{
          position: 'fixed',

          bottom: '80px',

          right: '20px',

          zIndex: 9997,

          backgroundColor:
            'var(--primary)',

          color: 'white',

          border: 'none',

          width: '60px',

          height: '60px',

          borderRadius: '50%',

          boxShadow:
            '0 4px 12px rgba(255, 107, 0, 0.4)',

          display: 'flex',

          justifyContent:
            'center',

          alignItems:
            'center',

          cursor: 'pointer',

          transition:
            'transform 0.2s ease'
        }}

        onMouseOver={e =>
          e.currentTarget.style.transform =
            'scale(1.05)'
        }

        onMouseOut={e =>
          e.currentTarget.style.transform =
            'scale(1)'
        }
      >

        <svg
          xmlns="http://www.w3.org/2000/svg"

          width="24"

          height="24"

          viewBox="0 0 24 24"

          fill="none"

          stroke="currentColor"

          strokeWidth="2"

          strokeLinecap="round"

          strokeLinejoin="round"
        >

          <circle
            cx="9"
            cy="21"
            r="1"
          />

          <circle
            cx="20"
            cy="21"
            r="1"
          />

          <path
            d="
              M1 1h4l2.68 13.39
              a2 2 0 0 0 2 1.61
              h9.72a2 2 0 0 0 2-1.61
              L23 6H6
            "
          />

        </svg>


        {cartItemsCount > 0 && (

          <span
            style={{
              position: 'absolute',

              top: '-5px',

              right: '-5px',

              backgroundColor:
                'var(--danger)',

              color: 'white',

              fontSize: '12px',

              fontWeight: 'bold',

              width: '24px',

              height: '24px',

              borderRadius: '50%',

              display: 'flex',

              justifyContent:
                'center',

              alignItems:
                'center',

              border:
                '2px solid white'
            }}
          >
            {cartItemsCount}
          </span>

        )}

      </button>


      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <div className="header">

        <h1 className="page-title">
          Order Products
        </h1>

      </div>


      {/* =================================================
          PRODUCTS
          ================================================= */}

      <div
        style={{
          display: 'grid',

          gridTemplateColumns:
            'repeat(auto-fill, minmax(160px, 1fr))',

          gap: '1rem'
        }}
      >

        {products.map(p => (

          <div
            key={p._id}

            className="card"

            style={{
              display: 'flex',

              flexDirection:
                'column',

              padding: '0',

              overflow: 'hidden'
            }}
          >

            <div
              style={{
                width: '100%',

                height: '140px',

                backgroundColor:
                  '#f0f0f0',

                position: 'relative'
              }}
            >

              <img

                src={
                  p.imageUrl ||
                  'https://placehold.co/400x400?text=No+Image'
                }

                alt={p.name}

                style={{
                  width: '100%',

                  height: '100%',

                  objectFit: 'cover'
                }}

              />

            </div>


            <div
              style={{
                padding: '1rem',

                display: 'flex',

                flexDirection:
                  'column',

                flex: '1'
              }}
            >

              <h4
                style={{
                  margin:
                    '0 0 0.25rem 0',

                  fontSize:
                    '1rem'
                }}
              >
                {p.name}
              </h4>


              <p
                style={{
                  color:
                    'var(--gray-dark)',

                  fontSize:
                    '0.8rem',

                  margin: '0'
                }}
              >
                {p.category}
              </p>


              <div
                style={{
                  marginTop:
                    'auto',

                  paddingTop:
                    '1rem',

                  display: 'flex',

                  justifyContent:
                    'space-between',

                  alignItems:
                    'center'
                }}
              >

                <div
                  style={{
                    display: 'flex',

                    flexDirection:
                      'column'
                  }}
                >

                  <span
                    style={{
                      fontWeight:
                        'bold',

                      fontSize:
                        '1rem',

                      color:
                        'var(--primary)'
                    }}
                  >
                    ₹
                    {Number(
                      p.price
                    ).toFixed(2)}
                  </span>


                  <span
                    style={{
                      fontSize:
                        '0.75rem',

                      color:
                        'var(--gray-dark)'
                    }}
                  >
                    /{p.unit}
                  </span>

                </div>


                <button
                  className="btn btn-primary"

                  style={{
                    padding:
                      '0.4rem 0.8rem',

                    fontSize:
                      '0.9rem',

                    borderRadius:
                      '8px'
                  }}

                  onClick={() =>
                    addToCart(p, 1)
                  }
                >
                  Add
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>


    </div>

  );

};


export default Catalog;
