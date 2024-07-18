"use strict";
var UserStatus;
(function (UserStatus) {
    UserStatus["LoggedIn"] = "Logged In";
    UserStatus["LoggingIn"] = "Logging In";
    UserStatus["LoggedOut"] = "Logged Out";
    UserStatus["LogInError"] = "Log In Error";
    UserStatus["VerifyingLogIn"] = "Verifying Log In";
})(UserStatus || (UserStatus = {}));
var Default;
(function (Default) {
    Default["PIN"] = "1234";
})(Default || (Default = {}));
var WeatherType;
(function (WeatherType) {
    WeatherType["Cloudy"] = "Cloudy";
    WeatherType["Rainy"] = "Rainy";
    WeatherType["Stormy"] = "Stormy";
    WeatherType["Sunny"] = "Sunny";
})(WeatherType || (WeatherType = {}));
const defaultPosition = () => ({
    left: 0,
    x: 0
});
const N = {
    clamp: (min, value, max) => Math.min(Math.max(min, value), max),
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
};
const T = {
    format: (date) => {
        const hours = T.formatHours(date.getHours()), minutes = date.getMinutes(), seconds = date.getSeconds();
        return `${hours}:${T.formatSegment(minutes)}`;
    },
    formatHours: (hours) => {
        return hours % 24 === 0 ? 24 : hours % 24;
    },
    formatSegment: (segment) => {
        return segment < 10 ? `0${segment}` : segment;
    }
};
const LogInUtility = {
    verify: async (pin) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (pin === Default.PIN) {
                    resolve(true);
                }
                else {
                    reject(`Pin Inválido: ${pin}`);
                }
            }, N.rand(300, 700));
        });
    }
};
const useCurrentDateEffect = () => {
    const [date, setDate] = React.useState(new Date());
    React.useEffect(() => {
        const interval = setInterval(() => {
            const update = new Date();
            if (update.getSeconds() !== date.getSeconds()) {
                setDate(update);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [date]);
    return date;
};
const ScrollableComponent = (props) => {
    const ref = React.useRef(null);
    const [state, setStateTo] = React.useState({
        grabbing: false,
        position: defaultPosition()
    });
    const handleOnMouseDown = (e) => {
        setStateTo(Object.assign(Object.assign({}, state), { grabbing: true, position: {
                x: e.clientX,
                left: ref.current.scrollLeft
            } }));
    };
    const handleOnMouseMove = (e) => {
        if (state.grabbing) {
            const left = Math.max(0, state.position.left + (state.position.x - e.clientX));
            ref.current.scrollLeft = left;
        }
    };
    const handleOnMouseUp = () => {
        if (state.grabbing) {
            setStateTo(Object.assign(Object.assign({}, state), { grabbing: false }));
        }
    };
    return (React.createElement("div", { ref: ref, className: classNames("scrollable-component", props.className), id: props.id, onMouseDown: handleOnMouseDown, onMouseMove: handleOnMouseMove, onMouseUp: handleOnMouseUp, onMouseLeave: handleOnMouseUp }, props.children));
};
const WeatherSnap = () => {
    const [temperatureF] = React.useState(N.rand(65, 85)); // Temperatura aleatória em Fahrenheit
    const temperatureC = ((temperatureF - 32) * 5 / 9).toFixed(0); // Conversão para Celsius e arredondamento para nenhuma casa decimal

    return (React.createElement("span", { className: "weather" },
        React.createElement("i", { className: "weather-type", className: "fa fa-duotone fa fa-sun" }),
        React.createElement("span", { className: "weather-temperature-value" }, temperatureC),
        React.createElement("span", { className: "weather-temperature-unit" }, "\u00B0C")));
};
const Reminder = () => {
    return (React.createElement("div", { className: "reminder" },
        React.createElement("div", { className: "reminder-icon" },
            React.createElement("i", { className: "fa fa-regular fa-bell" })),
        React.createElement("span", { className: "reminder-text" },
            "Reunião de trabalho às ",
            React.createElement("span", { className: "reminder-time" }, "22:00"))));
};
const Time = () => {
    const date = useCurrentDateEffect();
    return (React.createElement("span", { className: "time" }, T.format(date)));
};
const Info = (props) => {
    return (React.createElement("div", { id: props.id, className: "info" },
        React.createElement(Time, null),
        React.createElement(WeatherSnap, null)));
};
const PinDigit = (props) => {
    const [hidden, setHiddenTo] = React.useState(false);
    React.useEffect(() => {
        if (props.value) {
            const timeout = setTimeout(() => {
                setHiddenTo(true);
            }, 500);
            return () => {
                setHiddenTo(false);
                clearTimeout(timeout);
            };
        }
    }, [props.value]);
    return (React.createElement("div", { className: classNames("app-pin-digit", { focused: props.focused, hidden }) },
        React.createElement("span", { className: "app-pin-digit-value" }, props.value || "")));
};
const Pin = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const [pin, setPinTo] = React.useState("");
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (userStatus === UserStatus.LoggingIn || userStatus === UserStatus.LogInError) {
            ref.current.focus();
        }
        else {
            setPinTo("");
        }
    }, [userStatus]);
    React.useEffect(() => {
        if (pin.length === 4) {
            const verify = async () => {
                try {
                    setUserStatusTo(UserStatus.VerifyingLogIn);
                    if (await LogInUtility.verify(pin)) {
                        setUserStatusTo(UserStatus.LoggedIn);
                    }
                }
                catch (err) {
                    console.error(err);
                    setUserStatusTo(UserStatus.LogInError);
                }
            };
            verify();
        }
        if (userStatus === UserStatus.LogInError) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    }, [pin]);
    const handleOnClick = () => {
        ref.current.focus();
    };
    const handleOnCancel = () => {
        setUserStatusTo(UserStatus.LoggedOut);
    };
    const handleOnChange = (e) => {
        if (e.target.value.length <= 4) {
            setPinTo(e.target.value.toString());
        }
    };
    const getCancelText = () => {
        return (React.createElement("span", { id: "app-pin-cancel-text", onClick: handleOnCancel }, "Cancel"));
    };
    const getErrorText = () => {
        if (userStatus === UserStatus.LogInError) {
            return (React.createElement("span", { id: "app-pin-error-text" }, "PIN Inválido"));
        }
    };
    return (React.createElement("div", { id: "app-pin-wrapper" },
        React.createElement("input", { disabled: userStatus !== UserStatus.LoggingIn && userStatus !== UserStatus.LogInError, id: "app-pin-hidden-input", maxLength: 4, ref: ref, type: "number", value: pin, onChange: handleOnChange }),
        React.createElement("div", { id: "app-pin", onClick: handleOnClick },
            React.createElement(PinDigit, { focused: pin.length === 0, value: pin[0] }),
            React.createElement(PinDigit, { focused: pin.length === 1, value: pin[1] }),
            React.createElement(PinDigit, { focused: pin.length === 2, value: pin[2] }),
            React.createElement(PinDigit, { focused: pin.length === 3, value: pin[3] })),
        React.createElement("h3", { id: "app-pin-label" },
            "Insira o PIN (1234) ",
            getErrorText(),
            " ",
            getCancelText())));
};
const MenuSection = (props) => {
    const getContent = () => {
        if (props.scrollable) {
            return (React.createElement(ScrollableComponent, { className: "menu-section-content" }, props.children));
        }
        return (React.createElement("div", { className: "menu-section-content" }, props.children));
    };
    return (React.createElement("div", { id: props.id, className: "menu-section" },
        React.createElement("div", { className: "menu-section-title" },
            React.createElement("i", { className: props.icon }),
            React.createElement("span", { className: "menu-section-title-text" }, props.title)),
        getContent()));
};
const QuickNav = () => {
    const getItems = () => {
        return [{
                id: 1,
                label: "Clima"
            }, {
                id: 2,
                label: "Comida"
            }, {
                id: 3,
                label: "Aplicativos"
            }, {
                id: 4,
                label: "Filmes"
            }].map((item) => {
            return (React.createElement("div", { key: item.id, className: "quick-nav-item clear-button" },
                React.createElement("span", { className: "quick-nav-item-label" }, item.label)));
        });
    };
    return (React.createElement(ScrollableComponent, { id: "quick-nav" }, getItems()));
};
const Weather = () => {
    const getDays = () => {
        return [{
                id: 1,
                name: "Segunda",
                temperature: Math.floor(N.rand(16, 27)), // Convertendo para Celsius
                weather: WeatherType.Sunny
            }, {
                id: 2,
                name: "Terça",
                temperature: Math.floor(N.rand(16, 27)), // Convertendo para Celsius
                weather: WeatherType.Sunny
            }, {
                id: 3,
                name: "Quarta",
                temperature: Math.floor(N.rand(16, 27)), // Convertendo para Celsius
                weather: WeatherType.Cloudy
            }, {
                id: 4,
                name: "Quinta",
                temperature: Math.floor(N.rand(16, 27)), // Convertendo para Celsius
                weather: WeatherType.Rainy
            }, {
                id: 5,
                name: "Sexta",
                temperature: Math.floor(N.rand(16, 27)), // Convertendo para Celsius
                weather: WeatherType.Stormy
            }, {
                id: 6,
                name: "Sábado",
                temperature: Math.floor(N.rand(16, 27)), // Convertendo para Celsius
                weather: WeatherType.Sunny
            }, {
                id: 7,
                name: "Domingo",
                temperature: Math.floor(N.rand(16, 27)), // Convertendo para Celsius
                weather: WeatherType.Cloudy
            }].map((day) => {
            const getIcon = () => {
                switch (day.weather) {
                    case WeatherType.Cloudy:
                        return "fa fa-duotone fa-clouds";
                    case WeatherType.Rainy:
                        return "fa fa-duotone fa-cloud-drizzle";
                    case WeatherType.Stormy:
                        return "fa fa-duotone fa-cloud-bolt";
                    case WeatherType.Sunny:
                        return "fa fa-duotone fa-sun";
                }
            };
            return (React.createElement("div", { key: day.id, className: "day-card" },
                React.createElement("div", { className: "day-card-content" },
                    React.createElement("span", { className: "day-weather-temperature" },
                        day.temperature,
                        React.createElement("span", { className: "day-weather-temperature-unit" }, "\u00B0C")),
                    React.createElement("i", { className: classNames("day-weather-icon", getIcon(), day.weather.toLowerCase()) }),
                    React.createElement("span", { className: "day-name" }, day.name))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa fa-solid fa-sun", id: "weather-section", scrollable: true, title: "Como está o clima lá fora?" }, getDays()));
};
const Tools = () => {
    const getTools = () => {

        const social1image = './assets/images/social/banner-social-1.jpg';
        const social2image = './assets/images/social/banner-social-2.jpg';
        const social3image = './assets/images/social/banner-social-3.jpg';
        const social4image = './assets/images/social/banner-social-4.jpg';
        const social5image = './assets/images/social/banner-social-5.jpg';
        const social6image = './assets/images/social/banner-social-6.jpg';

        return [{
                icon: "fa fa-solid  fa-cloud-sun",
                id: 1,
                image: social1image,
                label: "CLIMA",
                name: "Nublado"
            }, {
                icon: "fa fa-solid fa-calculator-simple",
                id: 2,
                image: social2image,
                label: "CÁLCULO",
                name: "Calculadora"
            }, {
                icon: "fa fa-solid fa-piggy-bank",
                id: 3,
                image: social3image,
                label: "FINANÇAS",
                name: "Banco"
            }, {
                icon: "fa fa-solid fa-plane",
                id: 4,
                image: social4image,
                label: "VIAGEM",
                name: "Planner"
            }, {
                icon: "fa fa-solid fa-gamepad-modern",
                id: 5,
                image: social5image,
                label: "JOGOS",
                name: "Play Store"
            }, {
                icon: "fa fa-solid fa-video",
                id: 6,
                image: social6image,
                label: "CHAT",
                name: "Google Meet"
            }].map((tool) => {
            const styles = {
                backgroundImage: `url(${tool.image})`
            };
            return (React.createElement("div", { key: tool.id, className: "tool-card" },
                React.createElement("div", { className: "tool-card-background background-image", style: styles }),
                React.createElement("div", { className: "tool-card-content" },
                    React.createElement("div", { className: "tool-card-content-header" },
                        React.createElement("span", { className: "tool-card-label" }, tool.label),
                        React.createElement("span", { className: "tool-card-name" }, tool.name)),
                    React.createElement("i", { className: classNames(tool.icon, "tool-card-icon") }))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa fa-solid fa-toolbox", id: "tools-section", title: "O que está acontecendo?" }, getTools()));
};
const Restaurants = () => {
    const getRestaurants = () => {

        const restaurante1image = './assets/images/restaurantes/banner-restaurante-1.jpg';
        const restaurante2image = './assets/images/restaurantes/banner-restaurante-2.jpg';
        const restaurante3image = './assets/images/restaurantes/banner-restaurante-3.jpg';
        const restaurante4image = './assets/images/restaurantes/banner-restaurante-4.jpg';

        return [{
                desc: "Os melhores hambúrgueres",
                id: 1,
                image: restaurante1image,
                title: "Hambúrgueres"
            }, {
                desc: "O melhor sorvete da região",
                id: 2,
                image: restaurante2image,
                title: "Sorvete"
            }, {
                desc: "Os melhores preços e sabores",
                id: 3,
                image: restaurante3image,
                title: "Pizza"
            }, {
                desc: "Churrasco não precisa de rima",
                id: 4,
                image: restaurante4image,
                title: "Churrasco"
            }].map((restaurant) => {
            const styles = {
                backgroundImage: `url(${restaurant.image})`
            };
            return (React.createElement("div", { key: restaurant.id, className: "restaurant-card background-image", style: styles },
                React.createElement("div", { className: "restaurant-card-content" },
                    React.createElement("div", { className: "restaurant-card-content-items" },
                        React.createElement("span", { className: "restaurant-card-title" }, restaurant.title),
                        React.createElement("span", { className: "restaurant-card-desc" }, restaurant.desc)))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa fa-regular fa-pot-food", id: "restaurants-section", title: "Peça de casa!" }, getRestaurants()));
};

const Movies = () => {
    const getMovies = () => {
        const filme1image = './assets/images/filmes/banner-filme-1.jpg';
        const filme2image = './assets/images/filmes/banner-filme-2.jpg';
        const filme3image = './assets/images/filmes/banner-filme-3.jpg';
        const filme4image = './assets/images/filmes/banner-filme-4.jpg';

        return [{
                desc: "Peter Quill vai reunir sua equipe para uma perigosa missão: salvar Rocket – missão que, se falhar, pode levar ao fim dos Guardiões como os conhecemos.",
                id: 1,
                icon: "fa fa-solid fa-galaxy",
                image: filme1image,
                title: "Guardiões da Galáxia: Vol. 3"
            }, {
                desc: "Agora, Gru (Leandro Hassum), Lucy (Maria Clara Gueiros), Margo (Bruna Laynes), Edith (Ana Elena Bittencourt) e Agnes (Pamella Rodrigues) dão as boas-vindas a um novo membro da família: Gru Jr., que pretende atormentar seu pai.",
                id: 2,
                icon: "fa fa-solid fa-hat-wizard",
                image: filme2image,
                title: "Meu Malvado Favorito 4"
            }, {
                desc: "Mais de uma década após os acontecimentos do primeiro filme, este deslumbrante novo filme conta a história da família Sully e apresenta ao público os majestosos tulkun oceânicos.",
                id: 3,
                icon: "fa fa-solid fa-broom-ball",
                image: filme3image,
                title: "Avatar: O Caminho Da Água"
            }, {
                desc: "Divertidamente 2 marca a sequência da famosa história de Riley (Kaitlyn Dias). Com um salto temporal, a garota agora se encontra mais velha, com 13 anos de idade, passando pela tão temida pré-adolescência",
                id: 4,
                icon: "fa fa-solid fa-starship-freighter",
                image: filme4image,
                title: "Divertida-Mente 2"
            }].map((movie) => {
            const styles = {
                backgroundImage: `url(${movie.image})`
            };
            const id = `movie-card-${movie.id}`;
            return (React.createElement("div", { key: movie.id, id: id, className: "movie-card" },
                React.createElement("div", { className: "movie-card-background background-image", style: styles }),
                React.createElement("div", { className: "movie-card-content" },
                    React.createElement("div", { className: "movie-card-info" },
                        React.createElement("span", { className: "movie-card-title" }, movie.title),
                        React.createElement("span", { className: "movie-card-desc" }, movie.desc)),
                    React.createElement("i", { className: movie.icon }))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa fa-solid fa-camera-movie", id: "movies-section", scrollable: true, title: "Hora da pipoca!" }, getMovies()));
};
const UserStatusButton = (props) => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        setUserStatusTo(props.userStatus);
    };
    return (React.createElement("button", { id: props.id, className: "user-status-button clear-button", disabled: userStatus === props.userStatus, type: "button", onClick: handleOnClick },
        React.createElement("i", { className: props.icon })));
};
const Menu = () => {
    return (React.createElement("div", { id: "app-menu" },
        React.createElement("div", { id: "app-menu-content-wrapper" },
            React.createElement("div", { id: "app-menu-content" },
                React.createElement("div", { id: "app-menu-content-header" },
                    React.createElement("div", { className: "app-menu-content-header-section" },
                        React.createElement(Info, { id: "app-menu-info" }),
                        React.createElement(Reminder, null)),
                    React.createElement("div", { className: "app-menu-content-header-section" },
                        React.createElement(UserStatusButton, { icon: "fa fa-solid fa-arrow-right-from-arc", id: "sign-out-button", userStatus: UserStatus.LoggedOut }))),
                React.createElement(QuickNav, null),
                React.createElement("a", { id: "github-link", className: "clear-button", href: "https://portfolio-2024-vinicius-alves.vercel.app/", target: "_blank" },
                    React.createElement("i", { className: "fa fa-solid fa-globe" }),
                    React.createElement("span", null, "Vinicius Alves")),
                React.createElement(Weather, null),
                React.createElement(Restaurants, null),
                React.createElement(Tools, null),
                React.createElement(Movies, null)))));
};
const Background = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        if (userStatus === UserStatus.LoggedOut) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    };
    return (React.createElement("div", { id: "app-background", onClick: handleOnClick },
        React.createElement("div", { id: "app-background-image", className: "background-image" })));
};
const Loading = () => {
    return (React.createElement("div", { id: "app-loading-icon" },
        React.createElement("i", { className: "fa fa-solid fa-spinner-third" })));
};
const AppContext = React.createContext(null);
const App = () => {
    const [userStatus, setUserStatusTo] = React.useState(UserStatus.LoggedOut);
    const getStatusClass = () => {
        return userStatus.replace(/\s+/g, "-").toLowerCase();
    };
    return (React.createElement(AppContext.Provider, { value: { userStatus, setUserStatusTo } },
        React.createElement("div", { id: "app", className: getStatusClass() },
            React.createElement(Info, { id: "app-info" }),
            React.createElement(Pin, null),
            React.createElement(Menu, null),
            React.createElement(Background, null),
            React.createElement("div", { id: "sign-in-button-wrapper" },
                React.createElement(UserStatusButton, { icon: "fa fa-solid fa-arrow-right-to-arc", id: "sign-in-button", userStatus: UserStatus.LoggingIn })),
            React.createElement(Loading, null))));
};
ReactDOM.render(React.createElement(App, null), document.getElementById("root"));