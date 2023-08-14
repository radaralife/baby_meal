import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import Slider from 'react-input-slider';

import { Card } from 'react-bootstrap';
import { Alert } from 'react-bootstrap';
import { Navbar, Nav } from 'react-bootstrap';

import badCombinationMeat from './badCombinationMeat.json';
import allergenVeggies from './allergenVeggies.json';
import ingredients from './ingredients.json';

const BottomNavbar = ({ onRecipeClick }) => {
  return (
    <Navbar fixed="bottom" bg="light" className="justify-content-around">
      <Nav.Link href="#recipe" onClick={(event) => {event.preventDefault(); onRecipeClick();}}>레시피</Nav.Link>
      <Nav.Link href="#ranking">랭킹</Nav.Link>
    </Navbar>
  );
};

const MealPlan = ({ mealPlan, babyMonth, stage, onRegeneratePlan, onMealSave, onMealDelete, isRecipeTab }) => {
  const getSubjectParticle = (word) => {
    const lastChar = word.charAt(word.length - 1);
    // If the last character is a vowel, return '은'; otherwise, return '는'
    return ['가', '나', '다', '라', '대', '린','림', '마', '망', '바', '사', '아', '차', '콩', '타', '파', '하'].includes(lastChar) ? '은' : '는';
  };
    
  const checkBadCombination = (meal) => {
    const ingredients = meal.map(item => item.ingredient);
    for (let i = 0; i < ingredients.length; i++) {
      if (badCombinationMeat[ingredients[i]]) {
        const badCombination = badCombinationMeat[ingredients[i]].find(ingredient => ingredients.includes(ingredient));
        if (badCombination) {
          return `주의: ${ingredients[i]}와 ${badCombination}은 좋지 않은 궁합입니다.`;
        }
      }
    }
    return null;
  };

  const checkAllergen = (meal) => {
    const ingredients = meal.map(item => item.ingredient);
    const allergens = allergenVeggies.filter(ingredient => ingredients.includes(ingredient));
    if (allergens.length > 0) {
      const allergenList = allergens.join(', ');
      const particle = getSubjectParticle(allergenList);
      return `주의: ${allergenList}${particle} 알레르기를 유발할 수 있습니다.`;
    }
    return null;
  };
  
  
  return (
    <div>
      <h2 className="text-center">{babyMonth ? `${babyMonth}개월 아기, ` : ''}{stage} 식단표</h2>
      <Row xs={1} md={2} className="g-4">
        {mealPlan.map((meal, index) => {
          const badCombinationWarning = checkBadCombination(meal);
          const allergenWarning = checkAllergen(meal);
          return (
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>메뉴 {index + 1}: {meal.slice(0, 2).map(item => item.ingredient).join(' ')} </Card.Title>
                  <Card.Text>
                  식재료: {meal.filter(item => item.ingredient !== undefined).map(item => `${item.ingredient} (${item.category})`).join(', ')}
                  </Card.Text>
                  {badCombinationWarning && <Alert variant="warning">{badCombinationWarning}</Alert>}
                  {allergenWarning && <Alert variant="danger">{allergenWarning}</Alert>}
                </Card.Body>
                <Card.Footer className="d-flex justify-content-end">
                {!isRecipeTab && <Button variant="success" onClick={() => onMealSave(meal)}>저장</Button>}
                  {isRecipeTab && <Button variant="danger" onClick={() => onMealDelete(meal)}>삭제</Button>}
                </Card.Footer>
              </Card>
            </Col>
          );
        })}
      </Row>
      {!isRecipeTab ? (
        <div className="d-flex justify-content-center mt-3">
          <Button className="floating" variant="primary" onClick={onRegeneratePlan}>
            식단표 다시 생성
          </Button>
        </div>
      ) : (
        <div className="d-flex justify-content-center mt-3">
          <Button variant="primary" onClick={onRegeneratePlan}>
            메뉴 생성하기
          </Button>
        </div>
      )}
    </div>
  );
};

const generateMealPlan = (menuCount, selectedMenuCount, selectedCategories, babyMonth) => {
  let mealPlan = [];
  const allCategories = Object.keys(ingredients);

  for (let i = 0; i < menuCount; i++) {
    const meal = [];
    const selectedIngredients = [];

    selectedCategories.forEach((category) => {
      // Collect all ingredients for the category up to the selected babyMonth
      let categoryItems = [];
      for (let month = 4; month <= babyMonth; month++) {
        categoryItems = categoryItems.concat(ingredients[category][month] || []);
      }
    
      // If the category has no items, skip this category
      if (categoryItems.length === 0) {
        return;
      }
   

      let randomIndex = Math.floor(Math.random() * categoryItems.length);

      while (selectedIngredients.includes(categoryItems[randomIndex])) {
        randomIndex = Math.floor(Math.random() * categoryItems.length);
      }

      selectedIngredients.push(categoryItems[randomIndex]);
      // Save the ingredient together with its category
      meal.push({ ingredient: categoryItems[randomIndex], category });
    });

    // If the meal is still less than the selected menu count, fill with random ingredients
    while (meal.length < selectedMenuCount) {
      const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];

      // Collect all ingredients for the category up to the selected babyMonth
      let categoryItems = [];
      for (let month = 4; month <= babyMonth; month++) {
        categoryItems = categoryItems.concat(ingredients[randomCategory][month] || []);
      }

      const randomIngredient = categoryItems[Math.floor(Math.random() * categoryItems.length)];

      if (!selectedIngredients.includes(randomIngredient)) {
        selectedIngredients.push(randomIngredient);
        // Save the ingredient together with its category
        meal.push({ ingredient: randomIngredient, category: randomCategory });
      }
    }

    mealPlan.push(meal);
  }

  return mealPlan;
};


const FoodSelectionForm = ({ onFormSubmit }) => {
  const [step, setStep] = useState(1);
  const [babyMonth, setBabyMonth] = useState(8);
  const [menuCount, setMenuCount] = useState(4);
  const [selectedMenuCount, setSelectedMenuCount] = useState(3);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Add a function to determine the stage based on the baby's month
  const determineStage = (babyMonth) => {
    if (babyMonth <= 6) {
      return "초기";
    } else if (babyMonth <= 9) {
      return "중기";
    } else if (babyMonth <= 12) {
      return "후기";
    } else {
      return "완료기";
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (step === 4) {
      const stage = determineStage(babyMonth); // Determine the stage based on the baby's month
      onFormSubmit(menuCount, selectedMenuCount, selectedCategories, babyMonth, stage);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Form className="form-input" onSubmit={handleFormSubmit}>
      <h3>Step {step} of 4</h3>

      {step === 1 && (
        <Form.Group className="mb-3" controlId="formBabyMonth">
          <Form.Label>아기의 개월 수를 선택하세요 (4~12개월)</Form.Label>
          <Slider
            axis="x"
            x={babyMonth}
            xmin={4}
            xmax={12}
            onChange={({ x }) => setBabyMonth(x)}
          />
          <div>선택된 개월 수: {babyMonth}</div>
        </Form.Group>
      )}

      {step === 2 && (
        <Form.Group className="mb-3" controlId="formSelectedCategories">
          <Form.Label>식재료 범주를 선택하세요</Form.Label>
          {Object.keys(ingredients).map((category) => {
            let categoryItems = [];
            for (let month = 4; month <= babyMonth; month++) {
              if (ingredients[category][month]) {
                categoryItems = categoryItems.concat(ingredients[category][month]);
              }
            }
            if (categoryItems.length > 0) {
              return (
                <Form.Check
                  type="checkbox"
                  label={category}
                  value={category}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedCategories((prevCategories) =>
                      prevCategories.includes(value)
                        ? prevCategories.filter((category) => category !== value)
                        : [...prevCategories, value]
                    );
                  }}
                />
              );
            } else {
              return null;
            }
          })}
        </Form.Group>
      )}


      {step === 3 && (
        <Form.Group className="mb-3" controlId="formSelectedMenuCount">
          <Form.Label>
            식재료를 조합하여 만들 수 있는 식재료의 개수를 선택하세요 (1 ~ 5)
          </Form.Label>
          <Slider
            axis="x"
            x={selectedMenuCount}
            xmin={1}
            xmax={5}
            onChange={({ x }) => setSelectedMenuCount(x)}
          />
          <div>선택된 조합 식재료 종류: {selectedMenuCount}</div>
        </Form.Group>
      )}

      {step === 4 && (        
        <Form.Group className="mb-3" controlId="formMenuCount">
          <Form.Label>원하는 메뉴의 개수를 선택하세요 (1 ~ 7)</Form.Label>
          <Slider
            axis="x"
            x={menuCount}
            xmin={1}
            xmax={7}
            onChange={({ x }) => setMenuCount(x)}
          />
          <div>선택된 메뉴 개수: {menuCount}</div>
        </Form.Group>
      )}

      <Button variant="primary" type="submit">
        {step === 4 ? '식단표 생성하기' : '다음'}
      </Button>
    </Form>
  );
};

const App = () => {
  const [isRecipeTab, setIsRecipeTab] = useState(false);
  const [setShowConfetti] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);
  const handleMealSave = (meal) => {
    // Save the meal to localStorage
    let savedMeals = localStorage.getItem('savedMeals');
    savedMeals = savedMeals ? JSON.parse(savedMeals) : [];
    savedMeals.push(meal);
    localStorage.setItem('savedMeals', JSON.stringify(savedMeals));
  
    // Remove the saved meal from the diet plan
    const newDietPlan = dietPlan.meals.filter(savedMeal => JSON.stringify(savedMeal) !== JSON.stringify(meal));
    setDietPlan({ meals: newDietPlan, babyMonth: dietPlan.babyMonth, stage: dietPlan.stage });
  };
  const handleMealDelete = (meal) => {
    // Load the saved meals from localStorage
    let savedMeals = localStorage.getItem('savedMeals');
    savedMeals = savedMeals ? JSON.parse(savedMeals) : [];
    
    // Filter out the selected meal
    savedMeals = savedMeals.filter(savedMeal => JSON.stringify(savedMeal) !== JSON.stringify(meal));
    
    // Save the updated meal list back to localStorage
    localStorage.setItem('savedMeals', JSON.stringify(savedMeals));
    
    // Update the diet plan in the state
    const newDietPlan = dietPlan.meals.filter(savedMeal => JSON.stringify(savedMeal) !== JSON.stringify(meal));
    setDietPlan({ meals: newDietPlan, babyMonth: dietPlan.babyMonth, stage: dietPlan.stage });
  };
  
  
  useEffect(() => {
    if (isRecipeTab) {
      handleLoadSavedMeals();
    }
  }, [isRecipeTab]);

  const handleLoadSavedMeals = () => {
    // Load the saved meals from localStorage
    let savedMeals = localStorage.getItem('savedMeals');
    savedMeals = savedMeals ? JSON.parse(savedMeals) : [];
    setDietPlan({ meals: savedMeals, babyMonth: null, stage: '저장된 ' });
    setIsRecipeTab(true); // 수정: isRecipeTab 상태를 true로 변경
  };
  
  
  const handleFormSubmit = (menuCount, selectedMenuCount, selectedCategories, babyMonth, stage) => {
    const plan = generateMealPlan(menuCount, selectedMenuCount, selectedCategories, babyMonth);
    setDietPlan({ meals: plan, babyMonth, stage }); // Pass babyMonth and stage along with the meal plan
  
    // Save the diet plan to localStorage
    localStorage.setItem('dietPlan', JSON.stringify({ meals: plan, babyMonth, stage }));
  
    // Save the input values
    setLastInputValues({ menuCount, selectedMenuCount, selectedCategories, babyMonth, stage });
  
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti('fade-out');
      setTimeout(() => setShowConfetti(false), 1000);
    }, 3000);
  };
  const [lastInputValues, setLastInputValues] = useState(null);
  const handleRegeneratePlan = () => {
    if (isRecipeTab) {
      // If the user is in the recipe tab, reset to the initial form
      setDietPlan(null);
      setIsRecipeTab(false);
      setLastInputValues(null);
    } else if (lastInputValues) {
      // If the user is in the menu result page and there are last input values, regenerate the plan based on them
      const { menuCount, selectedMenuCount, selectedCategories, babyMonth, stage } = lastInputValues;
      const plan = generateMealPlan(menuCount, selectedMenuCount, selectedCategories, babyMonth);
      setDietPlan({ meals: plan, babyMonth, stage });
    } else {
      // If the user is in the menu result page and there are no last input values, reset to the initial form
      setDietPlan(null);
      setIsRecipeTab(false);
    }
  };
  
  return (
    <Container className="App">
      {!dietPlan && (
        <Row className="justify-content-md-center">
          <Col xs lg="6">
            <FoodSelectionForm onFormSubmit={handleFormSubmit} />
          </Col>
        </Row>
      )}
      {dietPlan && (
        <div className="flex-grow-1 padded-top">
          <Row className="justify-content-md-center">
            <Col xs lg="6">
            <MealPlan
              mealPlan={dietPlan.meals}
              babyMonth={dietPlan.babyMonth}
              stage={dietPlan.stage}
              onRegeneratePlan={handleRegeneratePlan}
              onMealSave={handleMealSave}
              onMealDelete={handleMealDelete}
              isRecipeTab={isRecipeTab} // 수정: isRecipeTab 상태를 MealPlan 컴포넌트에 전달
            />
            </Col>
          </Row>
        </div>
      )}
      <BottomNavbar className="fixed-bottom-navbar" onRecipeClick={handleLoadSavedMeals} />
    </Container>
  );
};



export default App;