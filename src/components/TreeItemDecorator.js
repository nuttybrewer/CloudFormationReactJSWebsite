import React from 'react';
import PropTypes from 'prop-types';
import {FaMinusCircle, FaPlusCircle, FaFile, FaBars} from 'react-icons/fa';

const Header = ({style, node}) => {
    const icon = node.extractor_key ? <FaBars/> : <FaFile/>;
    // var actions;
    // if (node.source === '.') {
    //   actions = <FaPlusCircle/>
    // }
    // else if (node.children) {
    //   actions = <><FaPlusCircle /> <FaMinusCircle/></>
    // }
    // else {
    //   actions = <FaMinusCircle/>
    // }
    // <div style={style.actions}>
    //     { actions }
    // </div>
    return (
        <div style={style.base}>
            <div style={style.title}>
                {icon}
            </div>
            <div style={style.name}>
                {node.name}
            </div>

        </div>
    );
};

Header.propTypes = {
    node: PropTypes.object,
    style: PropTypes.object,
};

export default Header;
