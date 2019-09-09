export default {
    tree: {
        base: {
            listStyle: 'none',
            backgroundColor: 'white',
            margin: 0,
            padding: 0,
            color: 'rgb(105,111,117)',
            fontFamily: 'lucida grande ,tahoma,verdana,arial,sans-serif',
            height: '100%'
        },
        node: {
            base: {
                position: 'relative'
            },
            link: {
                cursor: 'pointer',
                position: 'relative',
                padding: '0px 5px',
                display: 'block'
            },
            activeLink: {
                background: 'LightGrey',
                borderRadius: '5px'
            },
            toggle: {
                base: {
                    position: 'relative',
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginLeft: '-5px',
                    height: '24px',
                    width: '0px'
                },
                wrapper: {
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    margin: '-7px 0 0 -7px',
                    height: '14px'
                },
                height: 14,
                width: 0,
                arrow: {
                    fill: 'none',
                    strokeWidth: 0
                }
            },
            header: {
                base: {
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    color: 'rgb(105,111,117)',
                    width: '100%'
                },
                connector: {
                    width: '2px',
                    height: '12px',
                    borderLeft: 'solid 2px black',
                    borderBottom: 'solid 2px black',
                    position: 'absolute',
                    top: '0px',
                    left: '-21px'
                },
                title: {
                    verticalAlign: 'middle',
                    float: 'left'
                },
                name: {
                  position: 'relative',
                  overflow: 'hidden',
                  maxWidth: '83%',
                  paddingLeft: '2px',
                  paddingRight: '2px',
                  float: 'left'
                },
                actions: {
                  float: 'right'
                }
            },
            subtree: {
                listStyle: 'none',
                paddingLeft: '19px'
            },
            loading: {
                color: 'rgb(105,111,117)'
            }
        }
    }
};
