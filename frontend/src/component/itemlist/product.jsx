import React, { Component } from "react";
import addItemToCart from "./addItemToCart";
import "./main.css";
import "./style.css";
import { BrowserRouter, Route, Link } from "react-router-dom";
import { connect } from "react-redux";
import LoginPopup from "../login/LoginPopup";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/opacity.css";

let onClickHandle = e => {};

class UnconnectedProduct extends Component {
  constructor(props) {
    super(props);
    this.state = {
      available: this.props.isAvailable,
      loginPopup: false
    };
  }
  availbleItem = () => {
    this.setState({ available: !this.state.available });
    let data = new FormData();
    data.append("isAvailable", this.state.available);

    fetch(`/items/${this.props._id}`, {
      method: "PUT",
      body: JSON.stringify({ isAvailable: !this.state.available }),
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    });
  };

  onClickAddItemToCart = itemId => {
    if (this.props.loggedIn) {
      addItemToCart(itemId);
    } else {
      this.setState({ loginPopup: true });
    }
  };

  closeLoginPopup = () => {
    this.setState({ loginPopup: false });
  };

  render() {
    const { _id, name, description, imgUrl, price, isAvailable } = this.props;
    let showDesc = "";

    // console.log("isAvailable", isAvailable);
    const customCSS = {
      opacity: `${this.state.available ? 1 : 0.5}`
      // transform: `rotateY(180deg)`
      // -webkit-transform: `rotateY(180deg)`;
      // -moz-transform: `rotateY(180deg)`;
      // -ms-transform: `rotateY(180deg)`;
      // -o-transform: `rotateY(180deg)`;
    };
    let classes = "";
    if (this.state.available)
      classes =
        "br2 ba dark-gray b--black-10 mv4 w-100 w-50-m w-25-l mw5 center articlediv";
    else
      classes =
        "br2 ba dark-gray b--black-10 mv4 w-100 w-50-m w-25-l mw5 center articlediv spin";

    return (
      <article className={classes} id={_id}>
        {!this.state.available && (
          <div
            className="notavailable"
            style={{ transform: "rotateY(180deg)" }}
          >
            Not available
          </div>
        )}
        {this.props.usertype === "2" && (
          <p className="availability-toggle" onClick={this.availbleItem}>
            {!this.state.available ? "o" : "x"}
          </p>
        )}
        <LazyLoadImage
          src={imgUrl}
          className="db w-100 br2 br--top"
          alt="Photo of a kitten looking menacing."
          effect="opacity"
          title={name}
          height="200px"
        />
        <div className="pa2 ph3-ns pb3-ns">
          <div className="dt w-100 mt1">
            <div className="dtc">
              <h1 className="f5 f4-ns mv0 itemName overflow-ellipsis">
                {name}
              </h1>
            </div>
            <div className="dtc tr">
              <h2 className="f5 mv0">{price}</h2>
            </div>
          </div>
          <p className="f6 lh-copy measure mt2 mid-gray itemDesc overflow-ellipsis">
            {description && description.substring(0, 1000)}
          </p>
          <div className="btn1">
            <button
              disabled={!this.state.available}
              className="f6 link dim br3 ph3 pv2 mb2 dib white btcolor  bn grow btncart"
              // onClick={() => addItemToCart(_id)}
              onClick={() => {
                this.onClickAddItemToCart(_id);
              }}
            >
              Add to cart
              <i className="fas fa-cart-plus" />
            </button>

            <Link
              className="f6 link dim br3 ph3 pv2 mb2 dib white btcolor  bn grow moreLinks"
              to={`/items/item/${_id}`}
            >
              More Details
            </Link>
          </div>
        </div>
        {this.state.loginPopup ? (
          <LoginPopup onClose={this.closeLoginPopup} />
        ) : null}
      </article>
    );
  }
}
let mapStateToProps = state => {
  return { usertype: state.usertype, loggedIn: state.loggedIn };
};

let Product = connect(mapStateToProps)(UnconnectedProduct);

export default Product;
