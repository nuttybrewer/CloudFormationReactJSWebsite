import React from 'react';
import PropTypes from 'prop-types';
import { FaFile, FaBars} from 'react-icons/fa';
// import {FaMinusCircle, FaPlusCircle } from 'react-icons/fa';


const Header = ({style, customStyles, node}) => {

    const icon = node.extractor_key ? <FaBars/> : <FaFile/>;
    // var actions;
    // if (node.source === 'fieldextraction.properties.allextractors.web') {
    //   actions = <FaPlusCircle />
    // }
    // else if (node.children) {
    //   actions = <><FaPlusCircle /><FaMinusCircle/></>
    // }
    // else {
    //   actions = <FaMinusCircle/>
    // }

    // <div style={style.actions}>
    //     { actions }
    // </div>
    return (
        <div style={style.base} >
            <div style={style.title}>
              {icon}
            </div>
            <div style={style.name}>
              { node.name }
            </div>
        </div>
    );
};

Header.propTypes = {
    node: PropTypes.object.isRequired,
    style: PropTypes.object,
    customStyles: PropTypes.object
};

Header.defaultProps = {
    customStyles: {}
};

export default Header;
