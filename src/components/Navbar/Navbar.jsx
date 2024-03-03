import React, { useEffect, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SearchIcon from "@mui/icons-material/Search";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import FavouriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { Link } from "react-router-dom";
import "./Navbar.scss"
import Cart from "../Cart/Cart";
import {useSelector, useDispatch} from "react-redux";
import { handleCart } from "../../redux/cartReducer";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const products = useSelector(state=>state.cart.products);
  const isCartOpen = useSelector(state=>state.cart.cartOpen);
  const location = useLocation().pathname;

  const dispatch = useDispatch();

  useEffect(() => {
      dispatch(handleCart(false))
  }, [location]);

  return (
    <div className="navbar">
      <div className="wrapper">
        <div className="mobilBtn">
        </div>
        <div className="left">
          <div className="item">
            <img src="/img/flag.png" alt="flag" />
            <KeyboardArrowDownIcon />
          </div>
          <div className="item">
            <span>USD</span>
            <KeyboardArrowDownIcon />
          </div>
          <div className="item underline">
            <Link className="link" to="/products/1">Women</Link>
          </div>
          <div className="item underline">
            <Link className="link" to="/products/2">Men</Link>
          </div>
          <div className="item underline">
            <Link className="link" to="/products/3">Children</Link>
          </div>
        </div>
        <div className="center">
            <Link className="link" to="/">M-store</Link>
        </div>
        <div className="right">
        <div className="item underline">
            <Link className="link" to="/">Home</Link>
        </div>
        <div className="item underline">
            <Link className="link" to="/about">About</Link>
        </div>
        <div className="item underline">
            <Link className="link" to="/">Contact</Link>
        </div>
        <div className="icons">
            <SearchIcon/>
            <PersonOutlineOutlinedIcon/>
            <FavouriteBorderOutlinedIcon/>
            <div 
            className="cartIcon"
            onClick={() => dispatch(handleCart(!isCartOpen))
            }>
                <ShoppingCartOutlinedIcon/>
                <span>{products?.length}</span>
            </div>
        </div>
        </div>

      </div>
      {isCartOpen && <Cart/>}
    </div>
  );
};

export default Navbar;
